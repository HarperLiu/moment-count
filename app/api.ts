// Simple HTTP client and API wrappers

const BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE ||
  "https://moment-count-server.vercel.app"
).replace(/\/$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function http<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const { method = "GET", body, headers } = options;

  const resp = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(headers || {}),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(
      `Request failed ${resp.status}: ${text || resp.statusText}`
    );
  }

  // Try parse JSON; allow empty bodies
  const contentType = resp.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await resp.json()) as T;
  }
  return undefined as unknown as T;
}

// Types from server (loosely typed; mapped in components)
export type ServerMemory = {
  id: string;
  title?: string;
  details?: string;
  date?: string; // ISO
  photos?: string[]; // server guarantees string[]
  user_id?: string;
};

export type ServerReceipt = {
  id: string;
  title?: string;
  details?: string;
  photos?: string[];
  timeCost?: { hours: number; minutes: number };
};

export type ServerAnniversary = {
  id: string;
  user_id: string;
  title: string;
  date: string; // yyyy-mm-dd
  reminder_days_before: number;
  reminder_text: string | null;
};

export type ServerUser = {
  id: string;
  uuid: string;
  name?: string;
  slogan?: string;
  avatar?: string;
  linked_user_uuid?: string | null;
};

export const api = {
  // Wrap server's { data: T } to return T directly for existing callers
  getMemories: async (userId: string): Promise<ServerMemory[]> => {
    return http<{ data: ServerMemory[] }>(
      `/memories?user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data);
  },
  createMemory: (payload: {
    title: string;
    details: string;
    photos: string[];
    date: string;
    userId: string;
  }): Promise<ServerMemory> =>
    http<{ data: ServerMemory }>("/memories", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  updateMemory: (
    id: string,
    payload: {
      title: string;
      details: string;
      photos: string[];
      date: string;
      userId: string;
    }
  ): Promise<ServerMemory> =>
    http<{ data: ServerMemory }>(`/memories/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: payload,
    }).then((r) => r.data),

  deleteMemory: (
    id: string,
    payload: { userId: string }
  ): Promise<void> =>
    http<void>(`/memories/${encodeURIComponent(id)}`, {
      method: "DELETE",
      body: payload,
    }),

  getReceipts: (userId: string): Promise<ServerReceipt[]> =>
    http<{ data: ServerReceipt[] }>(
      `/recipes?user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data),
  createReceipt: (payload: {
    title: string;
    details: string;
    photos: string[];
    timeCost: { hours: number; minutes: number };
    userId: string;
  }): Promise<ServerReceipt> =>
    http<{ data: ServerReceipt }>("/recipes", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  // Location/Distance related (server should implement these endpoints)
  postMyLocation: (payload: {
    lat: number;
    lon: number;
    userId: string;
  }): Promise<void> =>
    http<void>("/location", { method: "POST", body: payload }),
  getOtherLocation: (userId: string): Promise<{ lat: number; lon: number; updated_at?: string | null }> =>
    http<{ data: { lat: number; lon: number; updated_at?: string | null } }>(
      `/location/other?user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data),

  // Users
  upsertUser: (payload: {
    uuid: string;
    name: string;
    slogan: string;
    avatar: string;
  }): Promise<ServerUser> =>
    http<{ data: ServerUser }>("/users", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),
  getUserByUuid: (uuid: string): Promise<ServerUser | null> =>
    http<{ data: ServerUser } | undefined>(
      `/users?uuid=${encodeURIComponent(uuid)}`
    )
      .then((r) => (r as any)?.data || null)
      .catch(() => null),

  linkUser: (payload: {
    userUuid: string;
    partnerUuid?: string;
    partnerName?: string;
    relationshipStartDate?: string;
  }): Promise<{
    userUuid: string;
    linkedUserUuid: string;
    linkKey: string;
    relationshipStartDate: string | null;
  }> =>
    http<{
      data: {
        userUuid: string;
        linkedUserUuid: string;
        linkKey: string;
        relationshipStartDate: string | null;
      };
    }>("/users/link", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  unlinkUser: (payload: {
    userUuid: string;
  }): Promise<{ userUuid: string; unlinkedFrom: string | null }> =>
    http<{ data: { userUuid: string; unlinkedFrom: string | null } }>(
      "/users/unlink",
      {
        method: "POST",
        body: payload,
      }
    ).then((r) => r.data),

  getRelationship: (
    userUuid: string
  ): Promise<{
    linkKey: string;
    relationshipStartDate: string | null;
    createdAt: string;
    linkedUserUuid: string;
  } | null> =>
    http<{
      data: {
        linkKey: string;
        relationshipStartDate: string | null;
        createdAt: string;
        linkedUserUuid: string;
      } | null;
    }>(`/users/relationship?user_uuid=${encodeURIComponent(userUuid)}`)
      .then((r) => r.data)
      .catch(() => null),

  // Anniversaries
  getAnniversaries: (userId: string): Promise<ServerAnniversary[]> =>
    http<{ data: ServerAnniversary[] }>(
      `/anniversaries?user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data),

  createAnniversary: (payload: {
    userId: string;
    title: string;
    date: string;
    reminderDaysBefore?: number;
    reminderText?: string;
  }): Promise<ServerAnniversary> =>
    http<{ data: ServerAnniversary }>("/anniversaries", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  updateAnniversary: (
    id: string,
    payload: {
      userId: string;
      title?: string;
      date?: string;
      reminderDaysBefore?: number;
      reminderText?: string;
    }
  ): Promise<ServerAnniversary> =>
    http<{ data: ServerAnniversary }>(
      `/anniversaries/${encodeURIComponent(id)}`,
      { method: "PUT", body: payload }
    ).then((r) => r.data),

  deleteAnniversary: (id: string, payload: { userId: string }): Promise<void> =>
    http<void>(`/anniversaries/${encodeURIComponent(id)}`, {
      method: "DELETE",
      body: payload,
    }),

  // Push tokens
  registerPushToken: (payload: {
    userId: string;
    token: string;
  }): Promise<void> =>
    http<any>("/push-tokens", { method: "POST", body: payload }).then(
      () => undefined
    ),

  removePushToken: (payload: {
    userId: string;
    token: string;
  }): Promise<void> =>
    http<void>("/push-tokens", { method: "DELETE", body: payload }),

  // AI
  generateReminder: (payload: {
    title: string;
    lang: string;
  }): Promise<string> =>
    http<{ data: string }>("/ai/generate-reminder", { method: "POST", body: payload }).then((r) => r.data),

  // Auth
  register: (payload: {
    name: string;
    slogan?: string;
    avatar?: string;
    password: string;
  }): Promise<ServerUser> =>
    http<{ data: ServerUser }>("/auth/register", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),
  login: (payload: {
    username: string;
    password: string;
  }): Promise<ServerUser> =>
    http<{ data: ServerUser }>("/auth/login", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  deleteAccount: (payload: { uuid: string }): Promise<void> =>
    http<void>("/auth/delete-account", {
      method: "DELETE",
      body: payload,
    }),

  // Upload base64 image and return public URL
  uploadBase64Image: (payload: {
    filename: string;
    base64: string;
    contentType?: string;
  }): Promise<{ url: string }> =>
    http<{ data: { url: string } }>("/upload-base64", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  // Daily Q&A
  getDailyQuestion: (
    linkKey: string,
    userId: string
  ): Promise<{
    questionId: string;
    question: string;
    category: string;
    date: string;
    isCustom: boolean;
    myAnswer: string | null;
    partnerAnswer: string | null;
    bothAnswered: boolean;
    canReplace: boolean;
  }> =>
    http<{
      data: {
        questionId: string;
        question: string;
        category: string;
        date: string;
        isCustom: boolean;
        myAnswer: string | null;
        partnerAnswer: string | null;
        bothAnswered: boolean;
        canReplace: boolean;
      };
    }>(
      `/daily-question?link_key=${encodeURIComponent(linkKey)}&user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data),

  answerDailyQuestion: (payload: {
    questionId: string;
    userId: string;
    answer: string;
  }): Promise<{ answerId: string }> =>
    http<{ data: { answerId: string } }>("/daily-question/answer", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  replaceDailyQuestion: (payload: {
    linkKey: string;
    userId: string;
    customQuestion?: string;
  }): Promise<{
    questionId: string;
    question: string;
    category: string;
    date: string;
    isCustom: boolean;
  }> =>
    http<{
      data: {
        questionId: string;
        question: string;
        category: string;
        date: string;
        isCustom: boolean;
      };
    }>("/daily-question/replace", {
      method: "POST",
      body: payload,
    }).then((r) => r.data),

  getDailyQuestionHistory: (
    linkKey: string,
    userId: string
  ): Promise<
    Array<{
      questionId: string;
      question: string;
      category: string;
      date: string;
      isCustom: boolean;
      myAnswer: string | null;
      partnerAnswer: string | null;
      bothAnswered: boolean;
    }>
  > =>
    http<{
      data: Array<{
        questionId: string;
        question: string;
        category: string;
        date: string;
        isCustom: boolean;
        myAnswer: string | null;
        partnerAnswer: string | null;
        bothAnswered: boolean;
      }>;
    }>(
      `/daily-question/history?link_key=${encodeURIComponent(linkKey)}&user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data),
  // Time Capsules
  getCapsules: (userId: string, linkKey: string): Promise<Capsule[]> =>
    http<{ data: Capsule[] }>(
      `/capsules?user_id=${encodeURIComponent(userId)}&link_key=${encodeURIComponent(linkKey)}`
    ).then((r) => r.data),

  createCapsule: (data: {
    title: string;
    details?: string;
    photos?: string[];
    unlockAt: string;
    creatorId: string;
    recipientId: string;
    linkKey: string;
  }): Promise<Capsule> =>
    http<{ data: Capsule }>("/capsules", {
      method: "POST",
      body: data,
    }).then((r) => r.data),

  openCapsule: (capsuleId: string, userId: string): Promise<{ title: string; details: string | null; photos: string[] }> =>
    http<{ data: { title: string; details: string | null; photos: string[] } }>(
      `/capsules/${encodeURIComponent(capsuleId)}/open`,
      { method: "POST", body: { userId } }
    ).then((r) => r.data),

  destroyCapsule: (capsuleId: string, userId: string): Promise<void> =>
    http<void>(`/capsules/${encodeURIComponent(capsuleId)}/destroy`, {
      method: "POST",
      body: { userId },
    }),

  deleteCapsule: (capsuleId: string, userId: string): Promise<void> =>
    http<void>(
      `/capsules/${encodeURIComponent(capsuleId)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    ),

  // Truth or Dare
  generateTodQuestion: (
    type: TodType,
    intensity: number,
    linkKey: string,
    userId: string,
    language?: string,
    category?: string
  ): Promise<{ content: string }> =>
    http<{ data: { content: string } }>("/truth-or-dare/generate", {
      method: "POST",
      body: { type, intensity, linkKey, userId, language, category },
    }).then((r) => r.data),

  getCustomQuestions: (linkKey: string): Promise<CustomQuestion[]> =>
    http<{ data: CustomQuestion[] }>(
      `/truth-or-dare/custom?link_key=${encodeURIComponent(linkKey)}`
    ).then((r) => r.data),

  createCustomQuestion: (data: {
    type: TodType;
    content: string;
    intensity?: number;
    creatorId: string;
    linkKey: string;
  }): Promise<CustomQuestion> =>
    http<{ data: CustomQuestion }>("/truth-or-dare/custom", {
      method: "POST",
      body: data,
    }).then((r) => r.data),

  deleteCustomQuestion: (questionId: string, userId: string): Promise<void> =>
    http<void>(
      `/truth-or-dare/custom/${encodeURIComponent(questionId)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    ),

  // Wishes
  getWishes: (linkKey: string, userId: string): Promise<Wish[]> =>
    http<{ data: Wish[] }>(
      `/wishes?link_key=${encodeURIComponent(linkKey)}&user_id=${encodeURIComponent(userId)}`
    ).then((r) => r.data),

  createWish: (data: {
    title: string;
    note?: string;
    coverImage?: string;
    category: string;
    priority?: number;
    creatorId: string;
    linkKey: string;
  }): Promise<Wish> =>
    http<{ data: Wish }>("/wishes", { method: "POST", body: data }).then((r) => r.data),

  updateWish: (
    id: string,
    data: {
      title?: string;
      note?: string;
      coverImage?: string;
      category?: string;
      priority?: number;
      userId: string;
    }
  ): Promise<Wish> =>
    http<{ data: Wish }>(`/wishes/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: data,
    }).then((r) => r.data),

  deleteWish: (id: string, userId: string): Promise<void> =>
    http<void>(
      `/wishes/${encodeURIComponent(id)}?user_id=${encodeURIComponent(userId)}`,
      { method: "DELETE" }
    ),

  claimWish: (id: string, userId: string): Promise<Wish> =>
    http<{ data: Wish }>(`/wishes/${encodeURIComponent(id)}/claim`, {
      method: "POST",
      body: { userId },
    }).then((r) => r.data),

  unclaimWish: (id: string, userId: string): Promise<Wish> =>
    http<{ data: Wish }>(`/wishes/${encodeURIComponent(id)}/unclaim`, {
      method: "POST",
      body: { userId },
    }).then((r) => r.data),

  fulfillWish: (
    id: string,
    data: { userId: string; fulfillmentNote?: string; fulfillmentPhoto?: string }
  ): Promise<Wish> =>
    http<{ data: Wish }>(`/wishes/${encodeURIComponent(id)}/fulfill`, {
      method: "POST",
      body: data,
    }).then((r) => r.data),
};

export type Wish = {
  id: string;
  title: string;
  note: string | null;
  coverImage: string | null;
  category: string;
  priority: number;
  status: "open" | "claimed" | "fulfilled";
  claimedBy?: string | null;
  fulfilledAt: string | null;
  fulfillmentNote: string | null;
  fulfillmentPhoto: string | null;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  linkKey: string;
};

export type WishCategory = "travel" | "food" | "gift" | "experience" | "goal" | "other";

export type Capsule = {
  id: string;
  title: string;
  details: string | null;
  photos: string[];
  unlockAt: string;
  openedAt: string | null;
  destroyed: boolean;
  createdAt: string;
  creatorId: string;
  recipientId: string;
  linkKey: string;
};

export type TodType = "truth" | "dare";

export type CustomQuestion = {
  id: string;
  type: TodType;
  content: string;
  source: "ai" | "custom";
  intensity: number;
  createdAt: string;
  creatorId: string | null;
  linkKey: string;
};


export { BASE_URL };
