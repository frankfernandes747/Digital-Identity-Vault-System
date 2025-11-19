export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  role: "user" | "admin";
  created_at: string;
};

export type DocumentRow = {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  document_type: string | null;
  tags: string[] | null;
  expiry_date: string | null;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;
  category_id: number | null;
  profiles?: Profile;
};

export type Category = {
  id: number;
  name: string;
};


