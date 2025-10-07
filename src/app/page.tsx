// Home page - Display community posts
import { PostList } from '@/components/PostList';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loverse 表白墙</h1>
          <p className="text-gray-600">分享你的心声，匿名或实名都可以</p>
        </div>
        <PostList />
      </main>
    </div>
  );
}
