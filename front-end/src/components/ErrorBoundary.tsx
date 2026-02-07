import { Component, CSSProperties, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const containerStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50vh",
  padding: "20px",
  textAlign: "center",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const headingStyle: CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  color: "#333",
  marginBottom: "16px",
};

const paragraphStyle: CSSProperties = {
  fontSize: "16px",
  color: "#666",
  marginBottom: "24px",
  maxWidth: "400px",
};

const buttonStyle: CSSProperties = {
  padding: "12px 24px",
  fontSize: "16px",
  fontWeight: 500,
  color: "#fff",
  backgroundColor: "#228be6",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <h1 style={headingStyle}>
            Une erreur inattendue s&apos;est produite
          </h1>
          <p style={paragraphStyle}>
            Nous sommes désolés pour ce désagrément. Veuillez réessayer.
          </p>
          <button onClick={this.handleRetry} style={buttonStyle}>
            Réessayer
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
