<!DOCTYPE html>
<html>
<head>
    <title>Cita Confirmada</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2FA4A5;">58 MED</h2>
        
        <h3>Hola {{ $appointment->patient->name }},</h3>
        <p>¡Buenas noticias! Tu cita con el <strong>Dr(a). {{ $appointment->doctor->name }}</strong> ha sido confirmada.</p>

        <div style="background-color: #e6f7f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Fecha y Hora:</strong> {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('d/m/Y h:i A') }}</p>
            @if($appointment->doctor->specialty)
                <p><strong>Especialidad:</strong> {{ $appointment->doctor->specialty }}</p>
            @endif
        </div>

        <p>Por favor, intenta llegar 10 minutos antes de tu cita.</p>
        <p>Gracias por usar 58 MED.</p>
    </div>
</body>
</html>
