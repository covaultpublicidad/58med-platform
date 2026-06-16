<!DOCTYPE html>
<html>
<head>
    <title>Cita Reprogramada</title>
</head>
<body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2FA4A5;">58 MED</h2>
        
        <h3>Hola {{ $appointment->patient->name }},</h3>
        <p>Tu cita con el <strong>Dr(a). {{ $appointment->doctor->name }}</strong> ha sido reprogramada por el médico.</p>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeeba;">
            <p style="text-decoration: line-through; color: #856404;"><strong>Fecha Anterior:</strong> {{ \Carbon\Carbon::parse($oldDate)->format('d/m/Y h:i A') }}</p>
            <p style="color: #155724; font-size: 1.1em;"><strong>Nueva Fecha y Hora:</strong> {{ \Carbon\Carbon::parse($appointment->appointment_date)->format('d/m/Y h:i A') }}</p>
        </div>

        <p>La cita ahora está en estado <strong>Pendiente de Confirmación</strong>. Por favor, accede a tu panel para confirmar si estás de acuerdo con la nueva fecha.</p>
        <p>Gracias por usar 58 MED.</p>
    </div>
</body>
</html>
