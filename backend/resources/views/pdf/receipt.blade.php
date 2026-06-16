<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Recibo de Pago</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .logo { max-height: 60px; margin-bottom: 10px; }
        .receipt-title { font-size: 24px; color: #2FA4A5; margin: 0; }
        .receipt-number { color: #666; font-size: 12px; }
        .info-section { width: 100%; margin-bottom: 30px; }
        .info-section td { padding: 5px; vertical-align: top; }
        .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .details-table th { background-color: #f8f9fa; border-bottom: 2px solid #dee2e6; padding: 12px; text-align: left; }
        .details-table td { border-bottom: 1px solid #dee2e6; padding: 12px; }
        .total-row td { font-weight: bold; font-size: 18px; border-bottom: none; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
        .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background-color: #d1e7dd; color: #0f5132; font-weight: bold; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="receipt-title">RECIBO DE PAGO</h1>
        <div class="receipt-number">N° {{ $receipt->receipt_number }}</div>
    </div>

    <table class="info-section">
        <tr>
            <td width="50%">
                <strong>Médico Tratante:</strong><br>
                Dr/Dra. {{ $receipt->doctor->name }}<br>
                {{ $tenant ? $tenant->name : 'Consultorio Médico' }}<br>
                Fecha de Emisión: {{ $date }}
            </td>
            <td width="50%">
                <strong>Paciente:</strong><br>
                {{ $receipt->patient->name }}<br>
                Email: {{ $receipt->patient->email }}
            </td>
        </tr>
    </table>

    <table class="details-table">
        <thead>
            <tr>
                <th>Concepto</th>
                <th>Método de Pago</th>
                <th>Referencia</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $receipt->concept }}</td>
                <td>{{ $receipt->payment_method }}</td>
                <td>{{ $receipt->reference ?: 'N/A' }}</td>
                <td style="text-align: right;">{{ number_format($receipt->amount, 2) }} {{ $receipt->currency }}</td>
            </tr>
            <tr class="total-row">
                <td colspan="3" style="text-align: right; padding-top: 20px;">TOTAL PAGADO:</td>
                <td style="text-align: right; padding-top: 20px;">{{ number_format($receipt->amount, 2) }} {{ $receipt->currency }}</td>
            </tr>
        </tbody>
    </table>

    <div style="text-align: right; margin-top: 20px;">
        <span class="status-badge">PAGADO / CANCELADO</span>
    </div>

    <div class="footer">
        Este documento es un comprobante de pago digital sin crédito fiscal.<br>
        Generado por la plataforma 58 MED.
    </div>
</body>
</html>
