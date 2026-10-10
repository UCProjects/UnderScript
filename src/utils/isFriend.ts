import { global } from './global';
import * as user from './user';

export default (name: string): boolean => global('selfFriends', { throws: false })
  ?.some((friend: { username: string }) => user.name(friend) === name) ?? false;
