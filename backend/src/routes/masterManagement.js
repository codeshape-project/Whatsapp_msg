
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

// DELETE /api/master/branches/:id
// A branch can be deactivated only when no departments are linked to it.
router.delete("/branches/:id", async (req, res, next) => {
  try {
    const branchId = req.params.id;

    // Confirm that this branch belongs to the current organization.
    const { data: branch, error: branchError } = await supabase
      .from("branches")
      .select("id")
      .eq("id", branchId)
      .eq("organization_id", req.organizationId)
      .eq("is_active", true)
      .maybeSingle();

    failIfError(branchError);

    if (!branch) {
      return res.status(404).json({
        error: "Branch not found.",
      });
    }

    // Do not deactivate a branch while departments are linked to it.
    const { data: linkedDepartments, error: departmentError } =
      await supabase
        .from("departments")
        .select("id")
        .eq("organization_id", req.organizationId)
        .eq("branch_id", branchId)
        .limit(1);

    failIfError(departmentError);

    if (linkedDepartments?.length) {
      return res.status(409).json({
        error:
          "This branch has departments linked to it. Please handle those departments before deleting the branch.",
      });
    }

    const { error } = await supabase
      .from("branches")
      .update({ is_active: false })
      .eq("id", branchId)
      .eq("organization_id", req.organizationId);

    failIfError(error);

    return res.json({
      message: "Branch deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});


// DELETE /api/master/departments/:id
// Soft-delete the department to preserve historical records.
router.delete("/departments/:id", async (req, res, next) => {
  try {
    const departmentId = req.params.id;

    const { data, error } = await supabase
      .from("departments")
      .update({ is_active: false })
      .eq("id", departmentId)
      .eq("organization_id", req.organizationId)
      .eq("is_active", true)
      .select("id")
      .maybeSingle();

    failIfError(error);

    if (!data) {
      return res.status(404).json({
        error: "Department not found.",
      });
    }

    return res.json({
      message: "Department deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
