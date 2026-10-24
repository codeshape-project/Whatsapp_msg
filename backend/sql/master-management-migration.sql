
-- Branches and departments for each organization
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, name),
  UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  branch_id UUID NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT departments_branch_fk
    FOREIGN KEY (organization_id, branch_id)
    REFERENCES public.branches(organization_id, id)
    ON DELETE CASCADE,

  UNIQUE (organization_id, branch_id, name),
  UNIQUE (organization_id, id)
);

-- Keep the existing group_name column for compatibility.
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS branch_id UUID NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID NULL;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS branch_id UUID NULL,
  ADD COLUMN IF NOT EXISTS department_id UUID NULL;

-- Enforce organization-scoped assignments.
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_branch_fk
  FOREIGN KEY (organization_id, branch_id)
  REFERENCES public.branches(organization_id, id)
  ON DELETE SET NULL;

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_department_fk
  FOREIGN KEY (organization_id, department_id)
  REFERENCES public.departments(organization_id, id)
  ON DELETE SET NULL;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_branch_fk
  FOREIGN KEY (organization_id, branch_id)
  REFERENCES public.branches(organization_id, id)
  ON DELETE SET NULL;

ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_department_fk
  FOREIGN KEY (organization_id, department_id)
  REFERENCES public.departments(organization_id, id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS branches_org_idx
  ON public.branches(organization_id);

CREATE INDEX IF NOT EXISTS departments_org_branch_idx
  ON public.departments(organization_id, branch_id);

CREATE INDEX IF NOT EXISTS contacts_org_department_idx
  ON public.contacts(organization_id, department_id);

CREATE INDEX IF NOT EXISTS campaigns_org_department_idx
  ON public.campaigns(organization_id, department_id);

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
