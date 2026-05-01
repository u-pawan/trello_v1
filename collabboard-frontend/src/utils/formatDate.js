import { formatDistanceToNow } from 'date-fns';

export const formatRelative = (date) => {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch {
    return '';
  }
};
