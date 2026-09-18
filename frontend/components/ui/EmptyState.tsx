export function EmptyState({ icon, title, body, action }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="text-center py-8 px-5 bg-surface border border-border rounded-md shadow-e1">
      {icon && <div className="w-11 h-11 mx-auto mb-3 rounded-sm bg-brand-tint text-brand grid place-items-center">{icon}</div>}
      <h3 className="m-0 text-[14.5px] font-semibold">{title}</h3>
      {body && <p className="mt-1.5 mx-auto max-w-[29ch] text-text-2 text-[12.5px]">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
