
import { Router } from "express";
import { supabase } from "../db.js";

const router = Router();

function failIfError(error) {
  if (error) throw error;
}

// GET /api/master/branches
router.get("/branches", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("organization_id", req.organizationId)
      .eq("is_active", true)
      .order("name");

    failIfError(error);
    res.json({ data: data || [] });
  } catch (error) {
    next(error);
  }
});

// GET /api/master/departments?branch_id=<uuid>

/* GET /api/master/departments
   All departments:
   GET /api/master/departments

   Independent departments:
   GET /api/master/departments?branch_id=__independent__

   Branch-specific departments:
   GET /api/master/departments?branch_id=BRANCH_UUID
*/
router.get("/departments", async (req, res, next) => {
  try {
    const branchId = req.query.branch_id;

    let query = supabase
      .from("departments")
      .select("*")
      .eq("organization_id", req.organizationId)
      .eq("is_active", true)
      .order("name");

    if (branchId === "__independent__") {
      query = query.is("branch_id", null);
    } else if (branchId) {
      query = query.eq("branch_id", branchId);
    }
    // No branch_id: return all departments for this organization.

    const { data, error } = await query;

    if (error) throw error;

    res.json({ data: data || [] });
  } catch (error) {
    next(error);
  }
});


// POST /api/master/branches
router.post("/branches", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();

    if (!name) {
      return res.status(400).json({
        error: "Branch name is required.",
      });
    }

    const { data, error } = await supabase
      .from("branches")
      .insert({
        organization_id: req.organizationId,
        name,
        description: description || null,
      })
      .select()
      .single();

    failIfError(error);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

// POST /api/master/departments
router.post("/departments", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    const rawBranchId = req.body?.branch_id;

const branchId =
  !rawBranchId || rawBranchId === "__independent__"
    ? null
    : String(rawBranchId).trim();

    if (!name) {
      return res.status(400).json({
        error: "Department name is required.",
      });
    }

    // Validate that the branch belongs to this organization.
    if (branchId) {
      const { data: branch, error: branchError } = await supabase
        .from("branches")
        .select("id")
        .eq("id", branchId)
        .eq("organization_id", req.organizationId)
        .eq("is_active", true)
        .maybeSingle();

      failIfError(branchError);

      if (!branch) {
        return res.status(400).json({
          error: "Select a valid branch belonging to this organization.",
        });
      }
    }

    const { data, error } = await supabase
      .from("departments")
      .insert({
        organization_id: req.organizationId,
        branch_id: branchId,
        name,
        description: description || null,
      })
      .select()
      .single();

    failIfError(error);
    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
