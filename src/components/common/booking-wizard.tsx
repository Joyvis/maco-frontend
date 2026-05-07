'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAvailability, useCreateBooking } from '@/services/booking';
import { useDependencies } from '@/services/services';
import { useQualifiedStaff } from '@/services/qualifications';
import { ANY_STAFF_ID } from '@/types/booking';
import type { TimeSlot, BookingItem } from '@/types/booking';

import { CalendarStrip } from './calendar-strip';
import { TimeSlotGrid } from './time-slot-grid';
import { StaffPickerGrid } from './staff-picker-grid';
import { BookingConfirmation } from './booking-confirmation';

type Step = 1 | 2 | 3;

interface BookingWizardProps {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  shopSlug: string;
  items?: BookingItem[];
}

function todayDate(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function BookingWizard({
  serviceId,
  serviceName,
  servicePrice,
  shopSlug,
  items = [],
}: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState<string | null>(
    null,
  );
  const startDate = todayDate();

  const { data: slots = [], isLoading: slotsLoading } = useAvailability(
    serviceId,
    selectedDate ?? '',
    shopSlug,
  );

  const { data: staff = [], isLoading: staffLoading } =
    useQualifiedStaff(serviceId);

  const { data: dependencies = [] } = useDependencies(serviceId);

  const availableDates = Array.from(
    new Set(slots.filter((s) => s.available).map((s) => s.date)),
  );

  const { mutateAsync: createBooking, isPending: isSubmitting } =
    useCreateBooking();

  function handleSelectDate(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleSelectStaff(staffId: string, staffName: string) {
    setSelectedStaffId(staffId);
    setSelectedStaffName(staffName);
  }

  async function handleConfirm() {
    if (!selectedDate || !selectedSlot) return;
    try {
      const result = await createBooking({
        service_id: serviceId,
        shop_slug: shopSlug,
        date: selectedDate,
        start_time: selectedSlot.start_time,
        ...(selectedStaffId && selectedStaffId !== ANY_STAFF_ID
          ? { staff_id: selectedStaffId }
          : {}),
      });
      const booking = result.data;
      if (booking.requires_payment && booking.payment_url) {
        router.push(booking.payment_url);
      } else {
        router.push(`/booking/${booking.id}/success`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      const isInfraError =
        message.startsWith('Network error') ||
        message.startsWith('Something went wrong') ||
        message.startsWith('Session expired');
      if (isInfraError) {
        toast.error(
          'Não foi possível confirmar o agendamento. Tente novamente.',
        );
      } else {
        toast.error(
          'Este horário não está mais disponível. Por favor, selecione outro horário.',
        );
        setSelectedSlot(null);
        setSelectedDate(null);
        setStep(1);
      }
    }
  }

  const canProceedFromStep1 = selectedDate !== null && selectedSlot !== null;
  const canProceedFromStep2 = selectedStaffId !== null;

  const autoIncludeItems: BookingItem[] = dependencies
    .filter((dep) => dep.auto_include)
    .map((dep) => ({
      service_id: dep.service_id,
      service_name: dep.service_name ?? dep.service_id,
      price: 0,
      included: true,
    }));

  const displayItems: BookingItem[] =
    items.length > 0
      ? items
      : [
          {
            service_id: serviceId,
            service_name: serviceName,
            price: servicePrice,
            included: false,
          },
          ...autoIncludeItems,
        ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {step > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setStep((s) => (s - 1) as Step)}
            aria-label="Voltar"
          >
            <ChevronLeft className="size-4" />
          </Button>
        )}
        <div className="flex gap-2">
          {([1, 2, 3] as const).map((n) => (
            <div
              key={n}
              className={`h-1.5 w-8 rounded-full transition-colors ${
                n <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Data e Horário</h3>
          <CalendarStrip
            startDate={startDate}
            availableDates={availableDates}
            selectedDate={selectedDate}
            onSelect={handleSelectDate}
          />
          {selectedDate && (
            <>
              {slotsLoading ? (
                <p className="text-muted-foreground text-sm">
                  Carregando horários...
                </p>
              ) : (
                <TimeSlotGrid
                  slots={slots}
                  selectedSlot={selectedSlot}
                  onSelect={setSelectedSlot}
                />
              )}
            </>
          )}
          <Button
            className="w-full"
            disabled={!canProceedFromStep1}
            onClick={() => setStep(2)}
          >
            Próximo
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Profissional</h3>
          <StaffPickerGrid
            staff={staff}
            selectedStaffId={selectedStaffId}
            onSelect={handleSelectStaff}
            isLoading={staffLoading}
          />
          <Button
            className="w-full"
            disabled={!canProceedFromStep2}
            onClick={() => setStep(3)}
          >
            Próximo
          </Button>
        </div>
      )}

      {step === 3 && selectedDate && selectedSlot && (
        <BookingConfirmation
          serviceName={serviceName}
          date={selectedDate}
          timeSlot={selectedSlot}
          staffName={
            selectedStaffId === ANY_STAFF_ID ? null : selectedStaffName
          }
          items={displayItems}
          isSubmitting={isSubmitting}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </div>
  );
}
