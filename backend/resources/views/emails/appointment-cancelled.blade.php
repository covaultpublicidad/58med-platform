<!DOCTYPE html>
<html>
<head>
    <title>Cita Cancelada</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #dc3545;">58 MED - Cancelación</h2>
        
        @if($cancelledBy === 'doctor')
            <h3>Hola {{ $appointment->patient->name }},</h3>
            <p>Lamentamos informarte que tu cita con el <strong>Dr(a). {{ $appointment->doctor->name }}</strong> ha sido cancelada por el consultorio.</p>
        @else
            <h3>Hola Dr(a). {{ $appointment->doctor->name }},</h3>
            <p>El paciente <strong>{{ $appointment->patient->name }}</strong> ha cancelado su cita programada.</p>
        @endif

        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0; color: #721c24;">
            <p><strong>Detalles de la cita cancelada:</strong></p>
            <p><strong>Fecha y Hora:</strong> {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('d/m/Y h:i A') }}</p>
            <p><strong>Paciente:</strong> {{ $appointment->patient->name }}</p>
            <p><strong>Médico:</strong> {{ $appointment->doctor->name }}</p>
        </div>

        @if($cancelledBy === 'doctor')
            <p>Si deseas agendar una nueva cita, puedes hacerlo desde la plataforma.</p>
        @endif
        
        <p>Gracias por usar 58 MED.</p>
    </div>
</body>
</html>
