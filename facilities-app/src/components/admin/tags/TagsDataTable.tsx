'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Search, Tag as TagIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import TagFormModal from './TagFormModal';
import type { Tag } from '@/types';

interface TagsDataTableProps {
  initialTags: Tag[];
}

export default function TagsDataTable({ initialTags }: TagsDataTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);

  const filtered = initialTags.filter((t) =>
    t.tagName.toLowerCase().includes(search.toLowerCase())
  );

  function refresh() {
    router.refresh();
    setFormOpen(false);
    setEditTag(null);
  }

  async function deleteTag(id: string) {
    if (!confirm('Delete this tag? It will be removed from all rooms.')) return;
    await fetch(`/api/tags/${id}`, { method: 'DELETE' });
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[1.9rem] border border-[var(--fass-border)] bg-white p-4 shadow-sm">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[var(--fass-blue)]" />
              <p className="text-xl font-semibold text-[var(--fass-text)]" style={{ fontFamily: 'var(--font-heading)' }}>
                Room labels
              </p>
            </div>

            <Button
              className="h-10 gap-2 rounded-full px-4 text-white"
              style={{ backgroundColor: 'var(--fass-blue)' }}
              onClick={() => setFormOpen(true)}
            >
              <Plus className="w-4 h-4" /> Add label
            </Button>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--fass-text-muted)]" />
              <Input
                className="h-10 rounded-xl border-[var(--fass-border)] pl-9"
                placeholder="Search labels"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Badge variant="outline" className="rounded-full px-3 py-1">
              {filtered.length} visible
            </Badge>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--fass-border)] bg-white shadow-sm">
        <div className="overflow-x-auto px-6 py-4 lg:px-7">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-[var(--fass-text-muted)] py-8">
                    No tags found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="gap-1.5 text-sm font-medium"
                        style={{ backgroundColor: `${tag.colorCode}18`, color: tag.colorCode, borderColor: `${tag.colorCode}33` }}
                      >
                        <TagIcon className="w-3 h-3" />
                        {tag.tagName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded border border-[var(--fass-border)]" style={{ backgroundColor: tag.colorCode }} />
                        <span className="text-xs font-mono text-[var(--fass-text-muted)]">{tag.colorCode}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[var(--fass-text-muted)]">
                      {new Date(tag.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--fass-text-muted)] hover:text-[var(--fass-blue)]"
                          onClick={() => { setEditTag(tag); setFormOpen(true); }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[var(--fass-text-muted)] hover:text-red-500"
                          onClick={() => deleteTag(tag.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <TagFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditTag(null); }}
        onSuccess={refresh}
        tag={editTag}
      />
    </div>
  );
}
