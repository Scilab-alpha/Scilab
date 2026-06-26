import ArticleDetail from "@/features/experiments/components/ArticleDetail";

interface StudentArticleDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StudentArticleDetailPage({
  params,
}: StudentArticleDetailPageProps) {
  const { id } = await params;
  return <ArticleDetail articleId={id} />;
}
