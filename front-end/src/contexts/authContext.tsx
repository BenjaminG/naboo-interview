import {
  GetUserQuery,
  GetUserQueryVariables,
  LogoutMutation,
  LogoutMutationVariables,
  SignInInput,
  SignUpInput,
  SigninMutation,
  SigninMutationVariables,
  SignupMutation,
  SignupMutationVariables,
} from "@/graphql/generated/types";
import Logout from "@/graphql/mutations/auth/logout";
import Signin from "@/graphql/mutations/auth/signin";
import Signup from "@/graphql/mutations/auth/signup";
import GetUser from "@/graphql/queries/auth/getUser";
import { useSnackbar } from "@/hooks";
import { useApolloClient, useLazyQuery, useMutation } from "@apollo/client";
import { useRouter } from "next/router";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface AuthContextType {
  user: GetUserQuery["getMe"] | null;
  isLoading: boolean;
  handleSignin: (input: SignInInput) => Promise<void>;
  handleSignup: (input: SignUpInput) => Promise<void>;
  handleLogout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: false,
  handleSignin: () => Promise.resolve(),
  handleSignup: () => Promise.resolve(),
  handleLogout: () => Promise.resolve(),
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const snackbar = useSnackbar();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<GetUserQuery["getMe"] | null>(null);
  const router = useRouter();
  const client = useApolloClient();

  const [getUser] = useLazyQuery<GetUserQuery, GetUserQueryVariables>(GetUser);
  const [signin] = useMutation<SigninMutation, SigninMutationVariables>(Signin);
  const [signup] = useMutation<SignupMutation, SignupMutationVariables>(Signup);
  const [logout] = useMutation<LogoutMutation, LogoutMutationVariables>(Logout);

  const snackbarRef = useRef(snackbar);
  useEffect(() => {
    snackbarRef.current = snackbar;
  });

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!user && isLoggedIn === "true") {
      getUser()
        .then((res) => setUser(res.data?.getMe || null))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignin = useCallback(
    async (input: SignInInput) => {
      try {
        setIsLoading(true);
        await signin({ variables: { signInInput: input } });
        localStorage.setItem("isLoggedIn", "true");
        await getUser({ fetchPolicy: "network-only" }).then((res) =>
          setUser(res.data?.getMe || null)
        );
        router.push("/profil");
      } catch (err) {
        snackbarRef.current.error("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    },
    [signin, getUser, router]
  );

  const handleSignup = useCallback(
    async (input: SignUpInput) => {
      try {
        setIsLoading(true);
        await signup({ variables: { signUpInput: input } });
        router.push("/signin");
      } catch (err) {
        snackbarRef.current.error("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    },
    [signup, router]
  );

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logout();
      localStorage.removeItem("isLoggedIn");
      setUser(null);
      await client.clearStore();
      router.push("/");
    } catch (err) {
      snackbarRef.current.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  }, [logout, client, router]);

  const value = useMemo(
    () => ({ user, isLoading, handleSignin, handleSignup, handleLogout }),
    [user, isLoading, handleSignin, handleSignup, handleLogout]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
