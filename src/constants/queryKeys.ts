export const queryKeys = {
  trees: () => ['trees'] as const,
  tree: (id: string) => ['tree', id] as const,
  persons: (treeId: string) => ['persons', treeId] as const,
  unions: (treeId: string) => ['unions', treeId] as const,
  userPreferences: () => ['user_preferences'] as const,
}
