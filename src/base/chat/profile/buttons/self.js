import { self } from 'src/utils/user';

export default function isSelf(user) {
  return `${user.id}` === `${self().id}`;
}
