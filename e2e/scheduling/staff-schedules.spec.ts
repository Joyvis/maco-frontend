import { test, expect } from '../fixtures';

test.describe('Gestão de Escalas', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/schedules');
  });

  test('selecionar funcionário abre editor semanal com 7 dias', async ({
    authedPage,
  }) => {
    const staffList = authedPage.getByTestId('schedule-staff-list');
    await expect(staffList).toBeVisible();

    const firstStaff = staffList.getByTestId('schedule-staff-item').first();
    await firstStaff.click();

    const editor = authedPage.getByTestId('schedule-editor');
    await expect(editor).toBeVisible();

    const dayRows = editor.getByTestId('schedule-day-row');
    await expect(dayRows).toHaveCount(7);
  });

  test('salvar horários atualiza resumo e exibe toast de sucesso', async ({
    authedPage,
  }) => {
    const staffList = authedPage.getByTestId('schedule-staff-list');
    await staffList.getByTestId('schedule-staff-item').first().click();

    const editor = authedPage.getByTestId('schedule-editor');
    await expect(editor).toBeVisible();

    const days = [
      { name: 'segunda', start: '09:00', end: '18:00' },
      { name: 'terca', start: '09:00', end: '18:00' },
      { name: 'quarta', start: '09:00', end: '18:00' },
      { name: 'quinta', start: '09:00', end: '18:00' },
      { name: 'sexta', start: '09:00', end: '18:00' },
      { name: 'sabado', start: '08:00', end: '14:00' },
    ];

    for (const day of days) {
      const row = editor.getByTestId(`schedule-day-row-${day.name}`);
      await row.getByTestId('schedule-start-time').fill(day.start);
      await row.getByTestId('schedule-end-time').fill(day.end);
    }

    const sundayRow = editor.getByTestId('schedule-day-row-domingo');
    await sundayRow.getByTestId('schedule-day-closed-toggle').click();

    await authedPage.getByTestId('schedule-save-button').click();

    await expect(authedPage.getByText('Salvo com sucesso')).toBeVisible();

    const summary = authedPage.getByTestId('schedule-summary');
    await expect(summary).toContainText('09:00');
    await expect(summary).toContainText('18:00');
  });

  test('adicionar bloqueio exibe sobreposição na grade de escala', async ({
    authedPage,
  }) => {
    const staffList = authedPage.getByTestId('schedule-staff-list');
    const staffItem = staffList.getByTestId('schedule-staff-item').first();
    await staffItem.hover();

    await staffItem.getByTestId('add-block-button').click();

    const blockForm = authedPage.getByTestId('block-form');
    await expect(blockForm).toBeVisible();

    await blockForm.getByTestId('block-start-date').fill('2025-05-01');
    await blockForm.getByTestId('block-end-date').fill('2025-05-05');

    await blockForm.getByTestId('block-submit-button').click();

    const scheduleEditor = authedPage.getByTestId('schedule-editor');
    await expect(
      scheduleEditor.getByTestId('schedule-block-overlay').first(),
    ).toBeVisible();
  });

  test('bloqueio conflitante com pedidos confirmados exibe toast de erro', async ({
    authedPage,
  }) => {
    // Requires backend to have a confirmed order overlapping the chosen dates
    const staffList = authedPage.getByTestId('schedule-staff-list');
    const staffItem = staffList.getByTestId('schedule-staff-item').first();
    await staffItem.hover();

    await staffItem.getByTestId('add-block-button').click();

    const blockForm = authedPage.getByTestId('block-form');
    await expect(blockForm).toBeVisible();

    // Use dates known to conflict with a seeded confirmed order
    await blockForm.getByTestId('block-start-date').fill('2025-05-10');
    await blockForm.getByTestId('block-end-date').fill('2025-05-10');

    await blockForm.getByTestId('block-submit-button').click();

    await expect(
      authedPage.getByText(/Conflito com \d+ pedido[s]? confirmado[s]?/),
    ).toBeVisible();
  });

  test('remover bloqueio exibe diálogo de confirmação e o remove', async ({
    authedPage,
  }) => {
    const staffList = authedPage.getByTestId('schedule-staff-list');
    await staffList.getByTestId('schedule-staff-item').first().click();

    const scheduleEditor = authedPage.getByTestId('schedule-editor');
    const overlay = scheduleEditor
      .getByTestId('schedule-block-overlay')
      .first();
    await expect(overlay).toBeVisible();

    await overlay.getByTestId('remove-block-button').click();

    const confirmDialog = authedPage.getByTestId('confirm-dialog');
    await expect(confirmDialog).toBeVisible();

    await confirmDialog.getByRole('button', { name: /confirmar/i }).click();

    await expect(overlay).not.toBeVisible();
  });
});
