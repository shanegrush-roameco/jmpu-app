// src/lib/exportUtils.js
// Sprint 11: Export utilities for generating PDF and Excel reports
// ============================================================================

import { supabase } from './supabase';

// ============================================================================
// Date Range Helpers
// ============================================================================

export function getQuarterDateRange(quarterString) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentQuarter = Math.floor(now.getMonth() / 3) + 1;

  // Parse quarter string like "This Quarter (Q2 2025)" or "Q4 2024"
  const match = quarterString.match(/Q(\d)\s*(\d{4})?/i);
  
  if (!match) {
    // Default to current quarter
    return getQuarterDates(currentYear, currentQuarter);
  }

  const quarter = parseInt(match[1]);
  const year = match[2] ? parseInt(match[2]) : currentYear;

  return getQuarterDates(year, quarter);
}

function getQuarterDates(year, quarter) {
  const startMonth = (quarter - 1) * 3;
  const endMonth = startMonth + 2;
  
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, endMonth + 1, 0); // Last day of the quarter

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    label: `Q${quarter} ${year}`,
  };
}

// ============================================================================
// Data Fetching for Reports
// ============================================================================

export async function fetchReportData(config) {
  const { startDate, endDate, includeFinancials, includeDraws, includeContractors } = config;

  const reportData = {
    generatedAt: new Date().toISOString(),
    dateRange: { startDate, endDate },
    financial: null,
    draws: null,
    contractors: null,
    projects: [],
  };

  try {
    // Always fetch projects as base data
    let projectsQuery = supabase
      .from('projects')
      .select(`
        id,
        name,
        project_number,
        status,
        project_type,
        budget_total,
        budget_spent,
        start_date,
        estimated_end_date,
        address_line1,
        city,
        state,
        project_manager:project_manager_id(full_name),
        company:company_id(name)
      `)
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (startDate) {
      projectsQuery = projectsQuery.gte('start_date', startDate);
    }
    if (endDate) {
      projectsQuery = projectsQuery.lte('start_date', endDate);
    }

    const { data: projects, error: projectsError } = await projectsQuery;
    if (projectsError) throw projectsError;
    reportData.projects = projects || [];

    // Financial data
    if (includeFinancials) {
      const totals = (projects || []).reduce(
        (acc, project) => {
          acc.totalBudget += parseFloat(project.budget_total) || 0;
          acc.totalSpent += parseFloat(project.budget_spent) || 0;
          return acc;
        },
        { totalBudget: 0, totalSpent: 0 }
      );

      reportData.financial = {
        income: totals.totalBudget,
        expenses: totals.totalSpent,
        margin: totals.totalBudget - totals.totalSpent,
        marginPercent: totals.totalBudget > 0 
          ? ((totals.totalBudget - totals.totalSpent) / totals.totalBudget * 100).toFixed(1)
          : 0,
      };
    }

    // Draws data
    if (includeDraws) {
      let drawsQuery = supabase
        .from('draw_requests')
        .select(`
          id,
          draw_number,
          title,
          amount_requested,
          amount_approved,
          status,
          submitted_at,
          project:project_id(name, project_number)
        `);

      if (startDate) {
        drawsQuery = drawsQuery.gte('submitted_at', startDate);
      }
      if (endDate) {
        drawsQuery = drawsQuery.lte('submitted_at', endDate);
      }

      const { data: draws, error: drawsError } = await drawsQuery;
      if (drawsError) throw drawsError;

      const drawStats = (draws || []).reduce(
        (acc, draw) => {
          const requested = parseFloat(draw.amount_requested) || 0;
          const approved = parseFloat(draw.amount_approved) || 0;
          
          acc.totalRequested += requested;
          
          if (draw.status === 'pending' || draw.status === 'submitted') {
            acc.pending += requested;
            acc.pendingCount += 1;
          } else if (draw.status === 'approved' || draw.status === 'paid') {
            acc.completed += approved;
            acc.completedCount += 1;
          }
          
          return acc;
        },
        { totalRequested: 0, pending: 0, completed: 0, pendingCount: 0, completedCount: 0 }
      );

      reportData.draws = {
        ...drawStats,
        items: draws || [],
      };
    }

    // Contractors data
    if (includeContractors) {
      const { data: contractors, error: contractorsError } = await supabase
        .from('project_contractors')
        .select(`
          id,
          role,
          status,
          hourly_rate,
          flat_rate,
          contractor:contractor_id(id, full_name, email, phone),
          project:project_id(name, project_number)
        `)
        .eq('status', 'active');

      if (contractorsError) throw contractorsError;
      reportData.contractors = contractors || [];
    }

    return reportData;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
}

// ============================================================================
// Excel Export (CSV format - universal compatibility)
// ============================================================================

export function generateExcelReport(reportData, config) {
  const { financialOutlook, drawsSummary, contractors } = config;
  const sheets = [];

  // Summary Sheet
  const summaryRows = [
    ['JMPU Report'],
    [`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`],
    [`Date Range: ${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}`],
    [''],
    ['Summary'],
    [`Total Projects: ${reportData.projects.length}`],
  ];

  if (reportData.financial) {
    summaryRows.push(
      [''],
      ['Financial Overview'],
      [`Total Budget (Income): $${reportData.financial.income.toLocaleString()}`],
      [`Total Spent (Expenses): $${reportData.financial.expenses.toLocaleString()}`],
      [`Margin: $${reportData.financial.margin.toLocaleString()} (${reportData.financial.marginPercent}%)`]
    );
  }

  if (reportData.draws) {
    summaryRows.push(
      [''],
      ['Draws Summary'],
      [`Total Requested: $${reportData.draws.totalRequested.toLocaleString()}`],
      [`Pending: $${reportData.draws.pending.toLocaleString()} (${reportData.draws.pendingCount} draws)`],
      [`Completed: $${reportData.draws.completed.toLocaleString()} (${reportData.draws.completedCount} draws)`]
    );
  }

  sheets.push({
    name: 'Summary',
    data: summaryRows,
  });

  // Projects Sheet
  if (reportData.projects.length > 0) {
    const projectRows = [
      ['Project Number', 'Name', 'Status', 'Type', 'Budget', 'Spent', 'Start Date', 'Est. Completion', 'Address', 'PM', 'Company'],
      ...reportData.projects.map(p => [
        p.project_number || '',
        p.name || '',
        p.status || '',
        p.project_type || '',
        p.budget_total || 0,
        p.budget_spent || 0,
        p.start_date || '',
        p.estimated_end_date || '',
        `${p.address_line1 || ''}, ${p.city || ''}, ${p.state || ''}`,
        p.project_manager?.full_name || '',
        p.company?.name || '',
      ]),
    ];

    sheets.push({
      name: 'Projects',
      data: projectRows,
    });
  }

  // Draws Sheet
  if (drawsSummary && reportData.draws?.items?.length > 0) {
    const drawRows = [
      ['Draw #', 'Title', 'Project', 'Amount Requested', 'Amount Approved', 'Status', 'Submitted'],
      ...reportData.draws.items.map(d => [
        d.draw_number || '',
        d.title || '',
        d.project?.name || '',
        d.amount_requested || 0,
        d.amount_approved || 0,
        d.status || '',
        d.submitted_at ? new Date(d.submitted_at).toLocaleDateString() : '',
      ]),
    ];

    sheets.push({
      name: 'Draw Requests',
      data: drawRows,
    });
  }

  // Contractors Sheet
  if (contractors && reportData.contractors?.length > 0) {
    const contractorRows = [
      ['Name', 'Email', 'Phone', 'Role', 'Project', 'Hourly Rate', 'Flat Rate', 'Status'],
      ...reportData.contractors.map(c => [
        c.contractor?.full_name || '',
        c.contractor?.email || '',
        c.contractor?.phone || '',
        c.role || '',
        c.project?.name || '',
        c.hourly_rate || '',
        c.flat_rate || '',
        c.status || '',
      ]),
    ];

    sheets.push({
      name: 'Contractors',
      data: contractorRows,
    });
  }

  // Generate CSV content (multi-sheet as separate sections)
  let csvContent = '';
  
  sheets.forEach((sheet, index) => {
    if (index > 0) {
      csvContent += '\n\n'; // Separator between sheets
    }
    csvContent += `=== ${sheet.name} ===\n`;
    csvContent += sheet.data.map(row => 
      row.map(cell => {
        // Escape cells that contain commas or quotes
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
  });

  return csvContent;
}

// ============================================================================
// PDF Export (HTML-based for browser printing)
// ============================================================================

export function generatePDFReport(reportData, config) {
  const { financialOutlook, drawsSummary, contractors } = config;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>JMPU Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          color: #1D1D1F;
          font-size: 12px;
          line-height: 1.5;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid #1D1D1F;
        }
        .logo { font-size: 24px; font-weight: bold; }
        .meta { text-align: right; color: #6B7280; font-size: 11px; }
        h1 { font-size: 20px; margin-bottom: 8px; }
        h2 { font-size: 16px; margin: 24px 0 12px; color: #1D1D1F; }
        .section { margin-bottom: 32px; }
        .card { 
          background: #F9FAFB; 
          border-radius: 8px; 
          padding: 16px; 
          margin-bottom: 16px;
        }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: 600; }
        .stat-label { color: #6B7280; font-size: 11px; }
        .green { color: #22C55E; }
        .red { color: #EF4444; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 11px;
          margin-top: 8px;
        }
        th, td { 
          text-align: left; 
          padding: 8px 12px; 
          border-bottom: 1px solid #E5E7EB;
        }
        th { 
          background: #F3F4F6; 
          font-weight: 600;
          color: #374151;
        }
        tr:nth-child(even) { background: #F9FAFB; }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
        }
        .status-planning { background: #F3F4F6; color: #374151; }
        .status-in_progress { background: #DCFCE7; color: #166534; }
        .status-on_hold { background: #FEF3C7; color: #92400E; }
        .status-completed { background: #D1FAE5; color: #065F46; }
        .status-pending { background: #FEF3C7; color: #92400E; }
        .status-approved { background: #DCFCE7; color: #166534; }
        .status-paid { background: #D1FAE5; color: #065F46; }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">JMPU</div>
          <h1>Project Management Report</h1>
        </div>
        <div class="meta">
          <div>Generated: ${formatDate(reportData.generatedAt)}</div>
          <div>Period: ${formatDate(reportData.dateRange.startDate)} - ${formatDate(reportData.dateRange.endDate)}</div>
        </div>
      </div>
  `;

  // Financial Section
  if (financialOutlook && reportData.financial) {
    html += `
      <div class="section">
        <h2>Financial Overview</h2>
        <div class="card">
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-value green">${formatCurrency(reportData.financial.income)}</div>
              <div class="stat-label">Total Budget (Income)</div>
            </div>
            <div class="stat">
              <div class="stat-value red">${formatCurrency(reportData.financial.expenses)}</div>
              <div class="stat-label">Total Spent (Expenses)</div>
            </div>
            <div class="stat">
              <div class="stat-value">${formatCurrency(reportData.financial.margin)}</div>
              <div class="stat-label">Margin (${reportData.financial.marginPercent}%)</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Draws Section
  if (drawsSummary && reportData.draws) {
    html += `
      <div class="section">
        <h2>Draw Requests Summary</h2>
        <div class="card">
          <div class="stats-grid">
            <div class="stat">
              <div class="stat-value">${formatCurrency(reportData.draws.totalRequested)}</div>
              <div class="stat-label">Total Requested</div>
            </div>
            <div class="stat">
              <div class="stat-value red">${formatCurrency(reportData.draws.pending)}</div>
              <div class="stat-label">Pending (${reportData.draws.pendingCount})</div>
            </div>
            <div class="stat">
              <div class="stat-value green">${formatCurrency(reportData.draws.completed)}</div>
              <div class="stat-label">Completed (${reportData.draws.completedCount})</div>
            </div>
          </div>
        </div>
        ${reportData.draws.items.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Draw #</th>
                <th>Title</th>
                <th>Project</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.draws.items.slice(0, 20).map(d => `
                <tr>
                  <td>${d.draw_number || '-'}</td>
                  <td>${d.title || '-'}</td>
                  <td>${d.project?.name || '-'}</td>
                  <td>${formatCurrency(d.amount_requested || 0)}</td>
                  <td>${formatCurrency(d.amount_approved || 0)}</td>
                  <td><span class="status-badge status-${d.status}">${d.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${reportData.draws.items.length > 20 ? `<p style="margin-top: 8px; color: #6B7280; font-size: 11px;">Showing 20 of ${reportData.draws.items.length} draw requests</p>` : ''}
        ` : ''}
      </div>
    `;
  }

  // Projects Section
  if (reportData.projects.length > 0) {
    html += `
      <div class="section">
        <h2>Projects (${reportData.projects.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Project #</th>
              <th>Name</th>
              <th>Status</th>
              <th>Budget</th>
              <th>Spent</th>
              <th>PM</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.projects.slice(0, 30).map(p => `
              <tr>
                <td>${p.project_number || '-'}</td>
                <td>${p.name || '-'}</td>
                <td><span class="status-badge status-${p.status}">${p.status?.replace('_', ' ') || '-'}</span></td>
                <td>${formatCurrency(p.budget_total || 0)}</td>
                <td>${formatCurrency(p.budget_spent || 0)}</td>
                <td>${p.project_manager?.full_name || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${reportData.projects.length > 30 ? `<p style="margin-top: 8px; color: #6B7280; font-size: 11px;">Showing 30 of ${reportData.projects.length} projects</p>` : ''}
      </div>
    `;
  }

  // Contractors Section
  if (contractors && reportData.contractors?.length > 0) {
    html += `
      <div class="section">
        <h2>Active Contractors (${reportData.contractors.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Project</th>
              <th>Contact</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.contractors.map(c => `
              <tr>
                <td>${c.contractor?.full_name || '-'}</td>
                <td>${c.role || '-'}</td>
                <td>${c.project?.name || '-'}</td>
                <td>${c.contractor?.email || '-'}</td>
                <td>${c.hourly_rate ? `$${c.hourly_rate}/hr` : c.flat_rate ? `$${c.flat_rate}` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  html += `
    </body>
    </html>
  `;

  return html;
}

// ============================================================================
// Download Helpers
// ============================================================================

export function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function openPDFInNewTab(htmlContent) {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };
}

export function downloadPDF(htmlContent, filename) {
  // For a more robust PDF solution, you'd use a library like jsPDF or html2pdf
  // This opens the HTML in a new tab where the user can use browser's "Save as PDF"
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

// ============================================================================
// Main Export Function
// ============================================================================

export async function generateAndDownloadReport(config) {
  const {
    range,
    financialOutlook,
    drawsSummary,
    contractors,
    subcontractors,
    formatPdf,
    formatExcel,
    formatGoogleDoc,
  } = config;

  try {
    // Get date range from quarter selection
    const { startDate, endDate, label } = getQuarterDateRange(range);

    // Fetch report data
    const reportData = await fetchReportData({
      startDate,
      endDate,
      includeFinancials: financialOutlook,
      includeDraws: drawsSummary,
      includeContractors: contractors || subcontractors,
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `JMPU-Report-${label.replace(' ', '-')}-${timestamp}`;

    // Generate requested formats
    if (formatExcel) {
      const csvContent = generateExcelReport(reportData, config);
      downloadCSV(csvContent, `${baseFilename}.csv`);
    }

    if (formatPdf) {
      const htmlContent = generatePDFReport(reportData, config);
      openPDFInNewTab(htmlContent);
    }

    if (formatGoogleDoc) {
      // For Google Docs, we'd need Google API integration
      // For now, we'll export as CSV which can be imported to Google Sheets
      const csvContent = generateExcelReport(reportData, config);
      downloadCSV(csvContent, `${baseFilename}-for-google.csv`);
    }

    return { success: true, reportData };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  getQuarterDateRange,
  fetchReportData,
  generateExcelReport,
  generatePDFReport,
  downloadCSV,
  openPDFInNewTab,
  downloadPDF,
  generateAndDownloadReport,
};
