import { db } from '@/lib/db';
import TagsDataTable from '@/components/admin/tags/TagsDataTable';

export const dynamic = 'force-dynamic';

export default async function AdminTagsPage() {
  const tags = await db.tag.findMany({ orderBy: { tagName: 'asc' } });

  return (
    <div className="space-y-6">
      <TagsDataTable initialTags={tags} />
    </div>
  );
}
