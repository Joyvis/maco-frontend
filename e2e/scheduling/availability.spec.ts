import { test, expect } from '../fixtures';

test.describe('Calendário de Disponibilidade', () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto('/schedules/availability');
  });

  test('carregamento exibe grade semanal com colunas de funcionários e slots coloridos', async ({
    authedPage,
  }) => {
    const grid = authedPage.getByTestId('availability-grid');
    await expect(grid).toBeVisible();

    // All three slot types must be present in the grid
    await expect(grid.getByTestId('slot-available').first()).toBeVisible();
    await expect(grid.getByTestId('slot-booked').first()).toBeVisible();
    await expect(grid.getByTestId('slot-blocked').first()).toBeVisible();
  });

  test('clicar em slot disponível redireciona para criação de pedido pré-preenchido', async ({
    authedPage,
  }) => {
    const grid = authedPage.getByTestId('availability-grid');
    await expect(grid).toBeVisible();

    const availableSlot = grid.getByTestId('slot-available').first();
    const staffId = await availableSlot.getAttribute('data-staff-id');
    const slotDate = await availableSlot.getAttribute('data-date');
    const slotTime = await availableSlot.getAttribute('data-time');

    await availableSlot.click();

    await authedPage.waitForURL(/\/orders\/new/);

    // Wizard must be pre-filled with staff + date + time from the slot
    if (staffId) {
      await expect(authedPage.getByTestId('order-wizard-staff-id')).toHaveValue(
        staffId,
      );
    }
    if (slotDate) {
      await expect(authedPage.getByTestId('order-wizard-date')).toHaveValue(
        slotDate,
      );
    }
    if (slotTime) {
      await expect(authedPage.getByTestId('order-wizard-time')).toHaveValue(
        slotTime,
      );
    }
  });

  test('clicar em slot reservado redireciona para detalhes do pedido', async ({
    authedPage,
  }) => {
    const grid = authedPage.getByTestId('availability-grid');
    await expect(grid).toBeVisible();

    const bookedSlot = grid.getByTestId('slot-booked').first();
    const orderId = await bookedSlot.getAttribute('data-order-id');

    await bookedSlot.click();

    await authedPage.waitForURL(/\/orders\//);

    if (orderId) {
      await expect(authedPage).toHaveURL(new RegExp(`/orders/${orderId}`));
    } else {
      await expect(authedPage).toHaveURL(/\/orders\//);
    }
  });
});
