import { global } from './global';
import * as user from './user';

export default (name) => global('selfFriends', { throws: false })?.some((friend) => user.name(friend) === name) ?? false;
