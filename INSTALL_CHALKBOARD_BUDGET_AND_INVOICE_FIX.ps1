$ErrorActionPreference = "Stop"

Set-Location "C:\Users\Dell\Downloads\chalkboard-x\chalkboard"

$file = ".\app\app\admin\page.js"

if (-not (Test-Path $file)) {
  throw "app\app\admin\page.js was not found."
}

$backup = ".\app\app\admin\page.before-budget-module.js"

if (-not (Test-Path $backup)) {
  Copy-Item $file $backup -Force
  Write-Host "Created backup: $backup"
}

$content = Get-Content $file -Raw

# Fix the learner query used by invoices and receipts.
$content = $content.Replace(
  ".select('id,full_name,email,phone')",
  ".select('id,full_name')"
)

$content = $content.Replace(
  "email:student?.email || '',",
  "email:'',"
)

$content = $content.Replace(
  "phone:student?.phone || '',",
  "phone:'',"
)

# Add Budget to Finance navigation.
$content = $content.Replace(
@'
        ['finance', 'Income and expenses', ''],
        ['pettycash', 'Petty cash', ''],
        ['banking', 'Banking', ''],
'@,
@'
        ['finance', 'Income and expenses', ''],
        ['budget', 'Annual budget', ''],
        ['pettycash', 'Petty cash', ''],
        ['banking', 'Banking', ''],
'@
)

$content = $content.Replace(
  "pettycash: 'Petty cash',",
  "pettycash: 'Petty cash',`r`n    budget: 'Annual budget',"
)

# Add the Budget render branch.
$content = $content.Replace(
  "nav === 'pettycash' ? <PettyCashPanel",
  "nav === 'budget' ? <BudgetPanel schoolId={schoolId} settings={settings} /> :`r`n        nav === 'pettycash' ? <PettyCashPanel"
)

$panel = @'
function BudgetPanel({ schoolId, settings }) {
  const currentYear = new Date().getFullYear();

  const [budgets, setBudgets] = useState([]);
  const [activeBudgetId, setActiveBudgetId] = useState('');
  const [lines, setLines] = useState([]);
  const [err, setErr] = useState('');

  const [budgetForm, setBudgetForm] = useState({
    financial_year: currentYear,
    title: `${currentYear} Annual Budget`,
    currency: settings?.currency || 'USD',
    projected_learner_count: 0,
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-12-31`,
    notes: '',
  });

  const [lineForm, setLineForm] = useState({
    line_type: 'income',
    category: 'Fees and levies',
    subcategory: '',
    source_type: 'fees',
    description: '',
    quantity: 1,
    unit_rate: 0,
    periods: 1,
    assumptions: '',
  });

  const activeBudget =
    budgets.find(item => item.id === activeBudgetId) || null;

  async function load() {
    const { data: budgetRows, error: budgetError } = await supabase
      .from('school_budgets')
      .select('*')
      .eq('school_id', schoolId)
      .order('financial_year', { ascending: false })
      .order('version', { ascending: false });

    if (budgetError) {
      setErr(budgetError.message);
      return;
    }

    setBudgets(budgetRows || []);

    const selected =
      activeBudgetId ||
      budgetRows?.[0]?.id ||
      '';

    if (!activeBudgetId && selected) {
      setActiveBudgetId(selected);
    }

    if (selected) {
      const { data: lineRows, error: lineError } = await supabase
        .from('school_budget_lines')
        .select('*')
        .eq('budget_id', selected)
        .order('line_type')
        .order('sort_order')
        .order('created_at');

      if (lineError) setErr(lineError.message);
      else setLines(lineRows || []);
    } else {
      setLines([]);
    }
  }

  useEffect(() => {
    load();
  }, [schoolId, activeBudgetId]);

  async function createBudget() {
    if (
      !budgetForm.title.trim() ||
      !budgetForm.financial_year
    ) {
      setErr('Enter a title and financial year.');
      return;
    }

    const sameYear = budgets.filter(
      item =>
        Number(item.financial_year) ===
        Number(budgetForm.financial_year)
    );

    const nextVersion =
      sameYear.length > 0
        ? Math.max(
            ...sameYear.map(item =>
              Number(item.version || 1)
            )
          ) + 1
        : 1;

    const { data, error } = await supabase
      .from('school_budgets')
      .insert({
        school_id: schoolId,
        financial_year:
          Number(budgetForm.financial_year),
        version: nextVersion,
        title: budgetForm.title.trim(),
        currency: budgetForm.currency,
        status: 'draft',
        start_date:
          budgetForm.start_date || null,
        end_date:
          budgetForm.end_date || null,
        projected_learner_count:
          Number(
            budgetForm.projected_learner_count ||
              0
          ),
        notes: budgetForm.notes || null,
      })
      .select()
      .single();

    if (error) {
      setErr(error.message);
      return;
    }

    setActiveBudgetId(data.id);
    await load();
  }

  async function addLine() {
    if (
      !activeBudgetId ||
      !lineForm.description.trim()
    ) {
      setErr(
        'Select a budget and enter a line description.'
      );
      return;
    }

    if (
      activeBudget &&
      ['approved', 'locked', 'archived'].includes(
        activeBudget.status
      )
    ) {
      setErr(
        'This budget cannot be changed in its current status.'
      );
      return;
    }

    const { error } = await supabase
      .from('school_budget_lines')
      .insert({
        budget_id: activeBudgetId,
        school_id: schoolId,
        line_type: lineForm.line_type,
        category: lineForm.category,
        subcategory:
          lineForm.subcategory || null,
        source_type:
          lineForm.source_type || null,
        description:
          lineForm.description.trim(),
        quantity: Number(
          lineForm.quantity || 0
        ),
        unit_rate: Number(
          lineForm.unit_rate || 0
        ),
        periods: Number(
          lineForm.periods || 0
        ),
        assumptions:
          lineForm.assumptions || null,
        sort_order: lines.length + 1,
      });

    if (error) {
      setErr(error.message);
      return;
    }

    setLineForm(current => ({
      ...current,
      subcategory: '',
      description: '',
      unit_rate: 0,
      assumptions: '',
    }));

    await load();
  }

  async function removeLine(id) {
    if (
      activeBudget &&
      ['approved', 'locked', 'archived'].includes(
        activeBudget.status
      )
    ) {
      setErr(
        'This budget cannot be changed in its current status.'
      );
      return;
    }

    const { error } = await supabase
      .from('school_budget_lines')
      .delete()
      .eq('id', id);

    if (error) setErr(error.message);
    else await load();
  }

  async function changeStatus(status) {
    if (!activeBudgetId) return;

    const update = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'submitted') {
      update.submitted_at =
        new Date().toISOString();
    }

    if (status === 'approved') {
      update.approved_at =
        new Date().toISOString();
    }

    const { error } = await supabase
      .from('school_budgets')
      .update(update)
      .eq('id', activeBudgetId);

    if (error) {
      setErr(error.message);
      return;
    }

    await supabase
      .from('school_budget_approvals')
      .insert({
        budget_id: activeBudgetId,
        school_id: schoolId,
        action: status,
      });

    await load();
  }

  function createFeeProjection() {
    setLineForm({
      line_type: 'income',
      category: 'Fees and levies',
      subcategory: 'School fees',
      source_type: 'fees',
      description: 'Projected school fee income',
      quantity:
        activeBudget?.projected_learner_count ||
        budgetForm.projected_learner_count ||
        0,
      unit_rate: 0,
      periods: 3,
      assumptions:
        'Projected learners × fee per learner × school terms',
    });
  }

  function createLevyProjection() {
    setLineForm({
      line_type: 'income',
      category: 'Fees and levies',
      subcategory: 'Levy',
      source_type: 'levy',
      description: 'Projected levy income',
      quantity:
        activeBudget?.projected_learner_count ||
        budgetForm.projected_learner_count ||
        0,
      unit_rate: 0,
      periods: 1,
      assumptions:
        'Projected learners × annual levy',
    });
  }

  const income = lines
    .filter(item => item.line_type === 'income')
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const expenses = lines
    .filter(item => item.line_type === 'expense')
    .reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

  const surplus = income - expenses;

  const expenseCategories = lines
    .filter(item => item.line_type === 'expense')
    .reduce((groups, item) => {
      groups[item.category] =
        (groups[item.category] || 0) +
        Number(item.amount || 0);
      return groups;
    }, {});

  const incomeCategories = [
    'Fees and levies',
    'Grants and donations',
    'Fundraising',
    'Facility income',
    'Other income',
  ];

  const expenseCategoryOptions = [
    'Staffing',
    'Teaching and learning',
    'Utilities',
    'Maintenance',
    'Administration',
    'Sports and activities',
    'Transport',
    'Technology',
    'Capital expenditure',
    'Finance costs',
    'Contingency',
    'Other expenses',
  ];

  return (
    <div>
      {err ? <p className="error">{err}</p> : null}

      <div className="card" style={{ marginBottom: 18 }}>
        <h3 style={{ marginTop: 0 }}>
          Create annual budget
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2,minmax(0,1fr))',
            gap: 10,
          }}
        >
          <input
            type="number"
            style={inputStyle}
            value={budgetForm.financial_year}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                financial_year:
                  event.target.value,
              }))
            }
            placeholder="Financial year"
          />

          <input
            style={inputStyle}
            value={budgetForm.title}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Budget title"
          />

          <input
            type="number"
            style={inputStyle}
            value={
              budgetForm.projected_learner_count
            }
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                projected_learner_count:
                  event.target.value,
              }))
            }
            placeholder="Projected learner count"
          />

          <input
            style={inputStyle}
            value={budgetForm.currency}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                currency: event.target.value,
              }))
            }
            placeholder="Currency"
          />

          <input
            type="date"
            style={inputStyle}
            value={budgetForm.start_date}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                start_date:
                  event.target.value,
              }))
            }
          />

          <input
            type="date"
            style={inputStyle}
            value={budgetForm.end_date}
            onChange={event =>
              setBudgetForm(current => ({
                ...current,
                end_date:
                  event.target.value,
              }))
            }
          />
        </div>

        <textarea
          style={{
            ...inputStyle,
            minHeight: 70,
            marginTop: 10,
          }}
          placeholder="Budget assumptions and notes"
          value={budgetForm.notes}
          onChange={event =>
            setBudgetForm(current => ({
              ...current,
              notes: event.target.value,
            }))
          }
        />

        <button
          onClick={createBudget}
          style={{ marginTop: 10 }}
        >
          Create budget version
        </button>
      </div>

      {budgets.length ? (
        <div className="card" style={{ marginBottom: 18 }}>
          <label style={labelStyle}>
            Budget version
          </label>

          <select
            style={inputStyle}
            value={activeBudgetId}
            onChange={event =>
              setActiveBudgetId(
                event.target.value
              )
            }
          >
            {budgets.map(item => (
              <option key={item.id} value={item.id}>
                {item.financial_year} · Version{' '}
                {item.version} · {item.title} ·{' '}
                {item.status}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {activeBudget ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(3,minmax(0,1fr))',
              gap: 12,
              marginBottom: 18,
            }}
          >
            {[
              [
                'Projected income',
                income,
              ],
              [
                'Planned expenditure',
                expenses,
              ],
              [
                surplus >= 0
                  ? 'Projected surplus'
                  : 'Projected deficit',
                surplus,
              ],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color:
                      label.includes('deficit')
                        ? '#c0392b'
                        : undefined,
                  }}
                >
                  {activeBudget.currency}{' '}
                  {Number(value).toFixed(2)}
                </div>
                <div className="muted">
                  {label}
                </div>
              </div>
            ))}
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <strong>
                  {activeBudget.title}
                </strong>
                <div className="muted">
                  FY {activeBudget.financial_year}
                  {' · '}
                  Version {activeBudget.version}
                  {' · '}
                  Status {activeBudget.status}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                {activeBudget.status ===
                'draft' ? (
                  <button
                    onClick={() =>
                      changeStatus('submitted')
                    }
                  >
                    Submit budget
                  </button>
                ) : null}

                {activeBudget.status ===
                'submitted' ? (
                  <>
                    <button
                      onClick={() =>
                        changeStatus('approved')
                      }
                    >
                      Approve
                    </button>
                    <button
                      className="ghost"
                      onClick={() =>
                        changeStatus('rejected')
                      }
                    >
                      Reject
                    </button>
                  </>
                ) : null}

                {activeBudget.status ===
                'approved' ? (
                  <button
                    onClick={() =>
                      changeStatus('locked')
                    }
                  >
                    Lock budget
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>
              Add budget line
            </h3>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              <button
                type="button"
                className="ghost"
                onClick={createFeeProjection}
              >
                Add projected fees
              </button>

              <button
                type="button"
                className="ghost"
                onClick={createLevyProjection}
              >
                Add projected levy
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(2,minmax(0,1fr))',
                gap: 10,
              }}
            >
              <select
                style={inputStyle}
                value={lineForm.line_type}
                onChange={event => {
                  const lineType =
                    event.target.value;

                  setLineForm(current => ({
                    ...current,
                    line_type: lineType,
                    category:
                      lineType === 'income'
                        ? incomeCategories[0]
                        : expenseCategoryOptions[0],
                    source_type:
                      lineType === 'income'
                        ? 'other_income'
                        : 'planned_expense',
                  }));
                }}
              >
                <option value="income">
                  Income
                </option>
                <option value="expense">
                  Expense
                </option>
              </select>

              <select
                style={inputStyle}
                value={lineForm.category}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    category:
                      event.target.value,
                  }))
                }
              >
                {(lineForm.line_type ===
                'income'
                  ? incomeCategories
                  : expenseCategoryOptions
                ).map(item => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <input
                style={inputStyle}
                placeholder="Subcategory"
                value={lineForm.subcategory}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    subcategory:
                      event.target.value,
                  }))
                }
              />

              <input
                style={inputStyle}
                placeholder="Description"
                value={lineForm.description}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    description:
                      event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                style={inputStyle}
                placeholder="Quantity / learner count"
                value={lineForm.quantity}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    quantity:
                      event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                style={inputStyle}
                placeholder="Rate per unit"
                value={lineForm.unit_rate}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    unit_rate:
                      event.target.value,
                  }))
                }
              />

              <input
                type="number"
                step="0.01"
                style={inputStyle}
                placeholder="Periods / terms"
                value={lineForm.periods}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    periods:
                      event.target.value,
                  }))
                }
              />

              <input
                style={inputStyle}
                placeholder="Assumptions"
                value={lineForm.assumptions}
                onChange={event =>
                  setLineForm(current => ({
                    ...current,
                    assumptions:
                      event.target.value,
                  }))
                }
              />
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 10,
                background: '#eef5ff',
              }}
            >
              Calculated amount:{' '}
              <strong>
                {activeBudget.currency}{' '}
                {(
                  Number(
                    lineForm.quantity || 0
                  ) *
                  Number(
                    lineForm.unit_rate || 0
                  ) *
                  Number(
                    lineForm.periods || 0
                  )
                ).toFixed(2)}
              </strong>
            </div>

            <button
              onClick={addLine}
              style={{ marginTop: 12 }}
            >
              Add budget line
            </button>
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <h3 style={{ marginTop: 0 }}>
              Budget detail
            </h3>

            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Calculation</th>
                  <th className="r">Amount</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {lines.map(item => (
                  <tr key={item.id}>
                    <td
                      style={{
                        textTransform:
                          'capitalize',
                      }}
                    >
                      {item.line_type}
                    </td>

                    <td>
                      {item.category}
                      {item.subcategory
                        ? ` · ${item.subcategory}`
                        : ''}
                    </td>

                    <td>
                      {item.description}
                      {item.assumptions ? (
                        <div
                          className="muted"
                          style={{ fontSize: 12 }}
                        >
                          {item.assumptions}
                        </div>
                      ) : null}
                    </td>

                    <td>
                      {Number(
                        item.quantity
                      ).toFixed(2)}
                      {' × '}
                      {Number(
                        item.unit_rate
                      ).toFixed(2)}
                      {' × '}
                      {Number(
                        item.periods
                      ).toFixed(2)}
                    </td>

                    <td className="r">
                      {activeBudget.currency}{' '}
                      {Number(
                        item.amount || 0
                      ).toFixed(2)}
                    </td>

                    <td className="r">
                      {[
                        'draft',
                        'rejected',
                      ].includes(
                        activeBudget.status
                      ) ? (
                        <button
                          className="ghost"
                          onClick={() =>
                            removeLine(item.id)
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {Object.keys(expenseCategories)
            .length ? (
            <div className="card">
              <h3 style={{ marginTop: 0 }}>
                Planned expenditure allocation
              </h3>

              {Object.entries(
                expenseCategories
              ).map(([category, amount]) => (
                <div
                  key={category}
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr auto',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom:
                      '1px solid #e5e7eb',
                  }}
                >
                  <span>{category}</span>

                  <strong>
                    {activeBudget.currency}{' '}
                    {Number(amount).toFixed(2)}
                    {' · '}
                    {expenses > 0
                      ? (
                          (Number(amount) /
                            expenses) *
                          100
                        ).toFixed(1)
                      : '0.0'}
                    %
                  </strong>
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <p className="muted">
          Create a budget version to begin.
        </p>
      )}
    </div>
  );
}
'@

$content = $content.Replace(
  "function SchoolBillingPanel({ schoolId }) {",
  $panel +
    "`r`n`r`nfunction SchoolBillingPanel({ schoolId }) {"
)

[System.IO.File]::WriteAllText(
  (Resolve-Path $file),
  $content,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Invoice learner query fixed."
Write-Host "Annual budgeting added under Finance."
Write-Host "Run the Supabase budget SQL before testing."
