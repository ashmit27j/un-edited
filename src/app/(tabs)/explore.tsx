import { FeedScreen } from '@/components/feed-screen';

/** Explore: stories from outlets the reader hasn't picked. Its own tab on phones; on web it opens Feed's Explore. */
export default function Explore() {
  return <FeedScreen mode="explore" />;
}
