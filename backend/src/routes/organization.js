
import { Router } from "express";
import multer from "multer";
import { supabase } from "../db.js";
import { requireOwner } from "../middleware/auth.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only PNG, JPG and WEBP images are allowed."));
    }

    cb(null, true);
  },
});

// GET organization profile
router.get("/profile", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id,name,type,location,settings")
      .eq("id", req.organizationId)
      .single();

    if (error) throw error;

    res.json({
      data: {
        ...data,
        logo_url: data.settings?.logo_url || "",
      },
    });
  } catch (error) {
    next(error);
  }
});

// UPDATE organization profile
router.patch(
  "/profile",
  requireOwner,
  upload.single("logo"),
  async (req, res, next) => {
    try {
      const { data: current, error: readError } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", req.organizationId)
        .single();

      if (readError) throw readError;

      const updates = {};

      if (req.body.name?.trim()) {
        updates.name = req.body.name.trim();
      }

      if (typeof req.body.location === "string") {
        updates.location = req.body.location.trim();
      }

      const settings = { ...(current.settings || {}) };

      if (req.file) {
        const ext =
          req.file.mimetype === "image/png"
            ? "png"
            : req.file.mimetype === "image/webp"
              ? "webp"
              : "jpg";

        const path = `${req.organizationId}/logo-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("organization-logos")
          .upload(path, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true,
            cacheControl: "3600",
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("organization-logos")
          .getPublicUrl(path);

        settings.logo_url = publicData.publicUrl;
      }

      updates.settings = settings;
      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("organizations")
        .update(updates)
        .eq("id", req.organizationId)
        .select("id,name,type,location,settings")
        .single();

      if (error) throw error;

      res.json({
        message: "Organization profile updated successfully.",
        data: {
          ...data,
          logo_url: data.settings?.logo_url || "",
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
