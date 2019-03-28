export function updatedRecords(labels, id, attrs) {
  return labels.map(label => {
    return (label.id === id)
      ? {...label, ...attrs}
      : label;
  });
}

export function updatedList(items, oldItem, newItem) {
  const index = items.indexOf(oldItem);
  const updated = items.slice(0);
  updated.splice(index, 1, newItem);
  return updated;
}
