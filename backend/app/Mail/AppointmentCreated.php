<?php

namespace App\Mail;

use App\Models\Appointment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentCreated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $appointment;
    public $isForDoctor;

    /**
     * Create a new message instance.
     */
    public function __construct(Appointment $appointment, $isForDoctor = false)
    {
        $this->appointment = $appointment;
        $this->isForDoctor = $isForDoctor;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->isForDoctor ? 'Nueva Cita Agendada' : 'Confirmación de Solicitud de Cita',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-created',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
