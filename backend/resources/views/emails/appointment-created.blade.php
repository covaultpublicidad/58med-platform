<!DOCTYPE html>
<html>
<head>
    <title>{{ $isForDoctor ? 'Nueva Cita Agendada' : 'Confirmación de Solicitud de Cita' }}</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2FA4A5;">58 MED</h2>
        
        @if($isForDoctor)
            <h3>Hola Dr(a). {{ $appointment->doctor->name }},</h3>
            <p>Tienes una nueva cita agendada en tu calendario.</p>
        @else
            <h3>Hola {{ $appointment->patient->name }},</h3>
            <p>Hemos recibido tu solicitud de cita. El médico la revisará y la confirmará pronto.</p>
        @endif

        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Paciente:</strong> {{ $appointment->patient->name }}</p>
            <p><strong>Médico:</strong> {{ $appointment->doctor->name }}</p>
            <p><strong>Fecha y Hora:</strong> {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('d/m/Y h:i A') }}</p>
            @if($appointment->reason)
                <p><strong>Motivo:</strong> {{ $appointment->reason }}</p>
            @endif
        </div>

        <p>Gracias por usar 58 MED.</p>
    </div>
</body>
</html>
