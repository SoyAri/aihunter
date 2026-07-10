export interface UserPreferences {
  occupation?: string;
  useCases: string[];
  contentTypes: string[];
  techLevel?: string;
  categories: string[];
}

export interface AITool {
  id: number;
  tool: string;
  tool_description: string;
  tool_image_url: string;
  category: string;
  upvotes: number;
  tags: string;
  match_pct?: number;
  reasons?: string[];
}

export interface Occupation {
  id: number;
  occupation_name: string;
}

export function emptyPreferences(): UserPreferences {
  return {
    occupation: undefined,
    useCases: [],
    contentTypes: [],
    techLevel: undefined,
    categories: [],
  };
}
