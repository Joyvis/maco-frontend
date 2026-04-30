'use client';

import {
  RESOURCES,
  ACTIONS,
  RESOURCE_LABELS,
  ACTION_LABELS,
} from '@/types/role';
import type { RolePermission, Resource, Action } from '@/types/role';
import { cn } from '@/lib/utils';

interface PermissionMatrixProps {
  value: RolePermission[];
  onChange: (value: RolePermission[]) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({
  value,
  onChange,
  readOnly = false,
}: PermissionMatrixProps) {
  function hasPermission(resource: Resource, action: Action): boolean {
    return value.some((p) => p.resource === resource && p.action === action);
  }

  function toggle(resource: Resource, action: Action) {
    if (readOnly) return;
    if (hasPermission(resource, action)) {
      onChange(
        value.filter((p) => !(p.resource === resource && p.action === action)),
      );
    } else {
      onChange([...value, { resource, action }]);
    }
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="px-4 py-2 text-left font-medium">Recurso</th>
            {ACTIONS.map((action) => (
              <th key={action} className="px-4 py-2 text-center font-medium">
                {ACTION_LABELS[action]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {RESOURCES.map((resource, i) => (
            <tr
              key={resource}
              className={cn(
                'border-b last:border-0',
                i % 2 === 0 ? '' : 'bg-muted/20',
              )}
            >
              <td className="px-4 py-2 font-medium">
                {RESOURCE_LABELS[resource]}
              </td>
              {ACTIONS.map((action) => (
                <td key={action} className="px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={hasPermission(resource, action)}
                    onChange={() => toggle(resource, action)}
                    disabled={readOnly}
                    aria-label={`${RESOURCE_LABELS[resource]} ${ACTION_LABELS[action]}`}
                    className="accent-primary h-4 w-4 cursor-pointer disabled:cursor-not-allowed"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
