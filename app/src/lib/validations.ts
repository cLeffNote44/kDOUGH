import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  unit: z.string(),
});

export const recipeFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(2000).optional().nullable(),
  ingredients: z.array(ingredientSchema),
  instructions: z.string().max(50000).optional().nullable(),
  source_url: z
    .string()
    .optional()
    .nullable()
    .transform((s) => (s === "" || s == null ? null : s))
    .refine((s) => s === null || /^https?:\/\//.test(s), {
      message: "Source URL must be a valid HTTP or HTTPS URL",
    }),
  servings: z.coerce.number().int().min(1).max(999),
  prep_time: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) =>
      v === "" || v == null ? null : Math.max(0, parseInt(String(v), 10) || 0)
    ),
  cook_time: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((v) =>
      v === "" || v == null ? null : Math.max(0, parseInt(String(v), 10) || 0)
    ),
  tags: z.array(z.string().max(50)),
});

export const importedRecipeSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  ingredients: z.array(ingredientSchema),
  instructions: z.string(),
  image_url: z.string().optional(),
  source_url: z.string().optional(),
  servings: z.number().int().min(1).max(999),
  prep_time: z.number().int().min(0).nullable().optional(),
  cook_time: z.number().int().min(0).nullable().optional(),
});

export const uuidSchema = z.string().uuid();

export const mealTypeSchema = z.enum([
  "breakfast",
  "snack",
  "lunch",
  "dinner",
  "dessert",
]);

export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
export type ImportedRecipeInput = z.infer<typeof importedRecipeSchema>;
