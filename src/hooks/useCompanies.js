import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useCompanies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, specialty')
        .order('name');
      if (!error) setCompanies(data || []);
      setLoading(false);
    }
    fetchCompanies();
  }, []);

  return { companies, loading };
}

export async function getProjectCompanies(projectId) {
  const { data, error } = await supabase
    .from('project_companies')
    .select('company_id, companies(id, name, specialty, phone, email, website)')
    .eq('project_id', projectId);
  if (error) return [];
  return data.map(row => row.companies);
}

export async function setProjectCompanies(projectId, companyIds) {
  await supabase
    .from('project_companies')
    .delete()
    .eq('project_id', projectId);

  if (companyIds.length === 0) return;

  const rows = companyIds.map(company_id => ({ project_id: projectId, company_id }));
  const { error } = await supabase
    .from('project_companies')
    .insert(rows);

  return error;
}
