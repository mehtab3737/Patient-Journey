import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const doctorName =
    user.user_metadata?.full_name || user.email || "Doctor";

  return (
    <div className="chat-layout">
      <header className="chat-header">
        <div className="chat-header-left">
          <div className="chat-header-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="chat-header-title">Patient Journey AI</h1>
            <span className="chat-header-subtitle">Clinical Decision Support</span>
          </div>
        </div>

        <div className="chat-header-right">
          <div className="chat-header-doctor">
            <div className="chat-header-doctor-avatar">
              {doctorName.charAt(0).toUpperCase()}
            </div>
            <span className="chat-header-doctor-name">{doctorName}</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="btn btn-ghost btn-sm" id="logout-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="chat-main">{children}</main>
    </div>
  );
}
