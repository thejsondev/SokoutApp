export type Role = "bewohner" | "hausverwaltung" | "hausmeister";

export type TicketStatus = "open" | "awaiting_appointment" | "referred" | "qa" | "done";

export type ApiUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  address: string;
  phone: string | null;
  role: Role;
};

export type ApiProject = {
  id: number;
  title: string;
  address: string;
  latitude: string | number | null;
  longitude: string | number | null;
  join_token?: string;
  hv_join_token?: string;
  hausverwaltung: ApiUser | null;
  members?: ApiUser[];
};

export type ApiTicketFile = {
  id: number;
  original_name: string;
  mime_type: string;
  size: number;
  url: string;
};

export type ApiTicketMessage = {
  id: number;
  body: string;
  kind?: "message" | "appointment" | "done";
  user?: ApiUser;
  files?: ApiTicketFile[];
  created_at: string;
};

export type ApiTicket = {
  id: number;
  status: TicketStatus;
  project_id: number;
  appointment_at?: string | null;
  user?: ApiUser;
  project?: (Pick<ApiProject, "id" | "title" | "address"> & {
    hausverwaltung?: ApiUser | null;
  }) | null;
  messages?: ApiTicketMessage[];
  can_rate?: boolean;
  rated?: boolean;
  created_at: string;
};
