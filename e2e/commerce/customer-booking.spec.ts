import { type Page } from '@playwright/test';

import { test, expect } from '../fixtures';

// Populated by globalSetup bootstrap (T2+). Override via env for local iteration.
const SHOP_SLUG = process.env.E2E_SHOP_SLUG ?? 'test-shop';

// ---------------------------------------------------------------------------
// Navigation helpers — keep tests focused on assertions, not wiring
// ---------------------------------------------------------------------------

async function goToShop(page: Page) {
  await page.goto(`/shop/${SHOP_SLUG}`);
  await expect(page.getByTestId('shop-name')).toBeVisible();
}

async function openServiceDatePicker(page: Page, serviceIndex = 0) {
  await page.getByTestId('service-book-button').nth(serviceIndex).click();
  await expect(page.getByTestId('datepicker-container')).toBeVisible();
}

async function pickFirstAvailableSlot(page: Page) {
  await page
    .locator('[data-testid="datepicker-date"][data-available="true"]')
    .first()
    .click();
  await page.getByTestId('timeslot-option').first().click();
  await page.getByTestId('booking-next-button').click();
}

async function selectAnyProfessional(page: Page) {
  await expect(page.getByTestId('professional-any-option')).toBeVisible();
  await page.getByTestId('professional-any-option').click();
  await page.getByTestId('booking-next-button').click();
}

// ---------------------------------------------------------------------------
// Spec
// ---------------------------------------------------------------------------

test.describe('customer booking flow', () => {
  // AC1 — shop page shows name, services, staff
  test('shop page displays name, services, and staff', async ({
    customerPage,
  }) => {
    await goToShop(customerPage);

    await expect(customerPage.getByTestId('shop-name')).toBeVisible();
    await expect(customerPage.getByTestId('shop-services-list')).toBeVisible();
    await expect(customerPage.getByTestId('shop-staff-list')).toBeVisible();
  });

  // AC2 — date picker availability dots
  test('date picker marks available dates and unavailable dates', async ({
    customerPage,
  }) => {
    await goToShop(customerPage);
    await openServiceDatePicker(customerPage);

    await expect(
      customerPage
        .locator('[data-testid="datepicker-date"][data-available="true"]')
        .first(),
    ).toBeVisible();
    await expect(
      customerPage
        .locator('[data-testid="datepicker-date"][data-available="false"]')
        .first(),
    ).toBeVisible();
  });

  // AC3 — professional selection shows qualified staff
  test('professional selection shows qualified staff after date and time selection', async ({
    customerPage,
  }) => {
    await goToShop(customerPage);
    await openServiceDatePicker(customerPage);
    await pickFirstAvailableSlot(customerPage);

    await expect(
      customerPage.getByTestId('professional-any-option'),
    ).toBeVisible();
    await expect(customerPage.getByTestId('professional-list')).toBeVisible();
    await expect(
      customerPage.getByTestId('professional-option').first(),
    ).toBeVisible();
  });

  test.describe('booking without prepayment', () => {
    // AC4 — summary shows "Any Available" and correct total
    test('confirmation summary shows Any Available and correct total', async ({
      customerPage,
    }) => {
      await goToShop(customerPage);
      await openServiceDatePicker(customerPage);
      await pickFirstAvailableSlot(customerPage);
      await selectAnyProfessional(customerPage);

      await expect(
        customerPage.getByTestId('booking-summary-professional'),
      ).toContainText(/Any Available|Qualquer Disponível/i);
      await expect(
        customerPage.getByTestId('booking-summary-total'),
      ).toBeVisible();
    });

    // AC5 + AC8 — confirms, shows success, booking in Upcoming tab
    test('confirmed order shows success screen and appears in Upcoming appointments', async ({
      customerPage,
    }) => {
      await goToShop(customerPage);
      await openServiceDatePicker(customerPage);
      await pickFirstAvailableSlot(customerPage);
      await selectAnyProfessional(customerPage);
      await customerPage.getByTestId('booking-confirm-button').click();

      await expect(
        customerPage.getByTestId('booking-success-screen'),
      ).toBeVisible();
      await expect(
        customerPage.getByTestId('booking-order-status'),
      ).toContainText(/Confirmado/i);

      // AC8 — booking visible in Upcoming tab
      await customerPage.goto('/appointments');
      await customerPage.getByTestId('appointments-upcoming-tab').click();
      await expect(
        customerPage.getByTestId('appointment-item').first(),
      ).toBeVisible();
    });
  });

  test.describe('booking with prepayment required', () => {
    // AC6 — prepayment required → redirect to payment screen
    test('confirm redirects to payment screen with amount due', async ({
      customerPage,
    }) => {
      await goToShop(customerPage);
      // service at index 1 is configured with a prepayment policy (>0%)
      await openServiceDatePicker(customerPage, 1);
      await pickFirstAvailableSlot(customerPage);
      await selectAnyProfessional(customerPage);
      await customerPage.getByTestId('booking-confirm-button').click();

      await expect(customerPage.getByTestId('payment-screen')).toBeVisible();
      await expect(
        customerPage.getByTestId('payment-amount-due'),
      ).toBeVisible();
    });

    // AC7 — Pix payment → success with order details and Add to Calendar
    test('Pix payment success shows order details and Add to Calendar button', async ({
      customerPage,
    }) => {
      await goToShop(customerPage);
      await openServiceDatePicker(customerPage, 1);
      await pickFirstAvailableSlot(customerPage);
      await selectAnyProfessional(customerPage);
      await customerPage.getByTestId('booking-confirm-button').click();

      await expect(customerPage.getByTestId('payment-screen')).toBeVisible();
      await customerPage.getByTestId('payment-pix-option').click();
      await customerPage.getByTestId('payment-submit-button').click();

      await expect(
        customerPage.getByTestId('booking-success-screen'),
      ).toBeVisible();
      await expect(
        customerPage.getByTestId('booking-order-details'),
      ).toBeVisible();
      await expect(
        customerPage.getByTestId('booking-add-to-calendar'),
      ).toBeVisible();
    });
  });
});
