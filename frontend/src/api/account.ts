import { api } from "./client";
import type { StatusResponse, User } from "./types";

export const accountApi = {
  updateProfile: (displayName: string) =>
    api<User>("/api/auth/me", {
      method: "PATCH",
      body: { display_name: displayName },
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api<StatusResponse>("/api/auth/password/change", {
      method: "POST",
      body: { current_password: currentPassword, new_password: newPassword },
    }),
  deleteAccount: (password: string) =>
    api<StatusResponse>("/api/auth/me", {
      method: "DELETE",
      body: { password },
    }),
};
