'use client';

import { useState, useRef } from 'react';
import { GripVertical, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useReorderCategories,
} from '@/services/categories';
import type { Category } from '@/types/product';

function sortByOrder(cats: Category[]): Category[] {
  return [...cats].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0),
  );
}

export function CategoryList() {
  const { data: categories, isLoading } = useCategories();
  const { mutateAsync: createCategory, isPending: isCreating } =
    useCreateCategory();
  const { mutateAsync: updateCategory, isPending: isUpdating } =
    useUpdateCategory();
  const { mutateAsync: deleteCategory } = useDeleteCategory();
  const { mutateAsync: reorderCategories } = useReorderCategories();

  const [sorted, setSorted] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newName, setNewName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  // Keep sorted state in sync with fetched data
  const displayed = sorted.length > 0 ? sorted : sortByOrder(categories);

  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    dragOverIndexRef.current = index;
  }

  async function handleDrop() {
    const from = dragIndexRef.current;
    const to = dragOverIndexRef.current;
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;

    if (from === null || to === null || from === to) return;

    const reordered = [...displayed];
    const [moved] = reordered.splice(from, 1);
    if (!moved) return;
    reordered.splice(to, 0, moved);

    const withOrder = reordered.map((cat, i) => ({
      ...cat,
      display_order: i,
    }));
    setSorted(withOrder);

    try {
      await reorderCategories(
        withOrder.map(({ id, display_order }) => ({
          id,
          display_order: display_order ?? 0,
        })),
      );
      toast.success('Ordem atualizada com sucesso.');
    } catch {
      setSorted(sortByOrder(categories));
      toast.error('Erro ao atualizar a ordem.');
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditValue(cat.name);
  }

  async function commitEdit(id: string) {
    const trimmed = editValue.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    try {
      await updateCategory({ id, input: { name: trimmed } });
      toast.success('Categoria atualizada.');
    } catch {
      toast.error('Erro ao atualizar categoria.');
    }
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue('');
  }

  async function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await createCategory({ name: trimmed });
      setNewName('');
      setShowAddForm(false);
      toast.success('Categoria criada.');
    } catch {
      toast.error('Erro ao criar categoria.');
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteCategory(id);
      setSorted([]);
      toast.success('Categoria excluída.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : '';
      if (msg.toLowerCase().includes('active')) {
        toast.error('Não é possível excluir uma categoria com itens ativos.');
      } else {
        toast.error('Erro ao excluir categoria.');
      }
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Carregando...</p>;
  }

  return (
    <div className="space-y-2">
      {displayed.length === 0 && !showAddForm && (
        <p className="text-muted-foreground text-sm">
          Nenhuma categoria cadastrada.
        </p>
      )}

      <ul className="divide-border divide-y rounded-md border" role="list">
        {displayed.map((cat, index) => (
          <li
            key={cat.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            className="flex items-center gap-2 px-3 py-2"
            data-testid={`category-row-${cat.id}`}
          >
            <GripVertical
              className="text-muted-foreground size-4 shrink-0 cursor-grab"
              aria-hidden
            />

            {editingId === cat.id ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void commitEdit(cat.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  autoFocus
                  className="h-7"
                  aria-label="Nome da categoria"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void commitEdit(cat.id)}
                  disabled={isUpdating}
                  aria-label="Confirmar"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  aria-label="Cancelar"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <>
                <span
                  className="flex-1 cursor-pointer text-sm"
                  onClick={() => startEdit(cat)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') startEdit(cat);
                  }}
                  aria-label={`Editar ${cat.name}`}
                >
                  {cat.name}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(cat)}
                  aria-label={`Renomear ${cat.name}`}
                >
                  <Pencil className="size-4" />
                </Button>
                <ConfirmDialog
                  title="Excluir Categoria"
                  description={`Tem certeza que deseja excluir "${cat.name}"?`}
                  confirmLabel="Excluir"
                  variant="destructive"
                  onConfirm={() => void handleDelete(cat.id)}
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      aria-label={`Excluir ${cat.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  }
                />
              </>
            )}
          </li>
        ))}
      </ul>

      {showAddForm ? (
        <div className="flex items-center gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd();
              if (e.key === 'Escape') {
                setShowAddForm(false);
                setNewName('');
              }
            }}
            placeholder="Nome da categoria"
            autoFocus
            className="h-8"
            aria-label="Nova categoria"
          />
          <Button
            size="sm"
            onClick={() => void handleAdd()}
            disabled={isCreating}
          >
            Adicionar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowAddForm(false);
              setNewName('');
            }}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="mr-2 size-4" />
          Nova Categoria
        </Button>
      )}
    </div>
  );
}
