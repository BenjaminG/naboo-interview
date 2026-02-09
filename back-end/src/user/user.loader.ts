import * as DataLoader from 'dataloader';
import { UserService } from './user.service';
import { User } from './user.schema';

export function createUserLoader(
  userService: UserService,
): DataLoader<string, User | null> {
  return new DataLoader<string, User | null>(async (ids) => {
    return userService.findByIds(ids as string[]);
  });
}
