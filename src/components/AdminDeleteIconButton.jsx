export default function AdminDeleteIconButton({
  label = 'Delete',
  title,
  disabled = false,
  onClick,
  style,
}) {
  return (
    <button
      type="button"
      className="admin-delete-icon-button"
      aria-label={label}
      title={title || label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '42px',
        height: '42px',
        minWidth: '42px',
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1.5px solid ${disabled ? '#CBD5E1' : '#DC2626'}`,
        borderRadius: '10px',
        background: '#fff',
        color: disabled ? '#94A3B8' : '#DC2626',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color .2s ease, color .2s ease, box-shadow .2s ease, transform .2s ease',
        ...style,
      }}
    >
      <svg
        aria-hidden="true"
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v5M14 11v5" />
      </svg>
    </button>
  )
}
