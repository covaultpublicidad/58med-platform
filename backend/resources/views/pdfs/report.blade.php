<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Informe Médico</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.6; font-size: 14px; }
        .header { border-bottom: 2px solid #2FA4A5; padding-bottom: 20px; margin-bottom: 30px; }
        .header-table { width: 100%; }
        .logo { max-width: 150px; max-height: 80px; }
        .doctor-info { text-align: right; }
        .doctor-name { font-size: 20px; font-weight: bold; color: #2FA4A5; margin: 0; }
        .patient-info { border: 1px solid #eee; padding: 15px; margin-bottom: 30px; }
        .patient-info table { width: 100%; }
        .title { text-align: center; font-size: 22px; font-weight: bold; margin-bottom: 30px; text-transform: uppercase; text-decoration: underline; }
        .content { margin-bottom: 50px; text-align: justify; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 10px; }
        .signatures { width: 100%; margin-top: 50px; }
        .signatures td { text-align: center; width: 33%; vertical-align: bottom; }
        .qr-code { width: 120px; height: 120px; }
        .signature-img { max-width: 150px; max-height: 80px; margin-bottom: 5px; }
        .stamp-img { max-width: 100px; max-height: 100px; }
        .signature-line { border-top: 1px solid #333; margin: 0 20px; padding-top: 5px; }
    </style>
</head>
<body>

    <div class="header">
        <table class="header-table">
            <tr>
                <td width="50%">
                    @if($report->doctor->tenant && $report->doctor->tenant->logo_url)
                        <img src="{{ public_path(str_replace('/storage/', 'storage/', $report->doctor->tenant->logo_url)) }}" class="logo">
                    @else
                        <h2 style="color: #2FA4A5; margin: 0;">58MED</h2>
                    @endif
                </td>
                <td class="doctor-info">
                    <h3 class="doctor-name">Dr. {{ $report->doctor->name }}</h3>
                    <div>{{ $report->doctor->specialty ?? 'Médico General' }}</div>
                    @if($report->doctor->medical_license)
                        <div>MPPS / Licencia: {{ $report->doctor->medical_license }}</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="title">{{ $report->title }}</div>

    <div class="patient-info">
        <table>
            <tr>
                <td width="60%"><strong>Paciente:</strong> {{ $report->patient->name }}</td>
                <td width="40%"><strong>Fecha:</strong> {{ date('d/m/Y', strtotime($report->date)) }}</td>
            </tr>
            <tr>
                <td><strong>C.I / DNI:</strong> {{ $report->patient->dni ?? 'N/A' }}</td>
                <td><strong>Teléfono:</strong> {{ $report->patient->phone ?? 'N/A' }}</td>
            </tr>
        </table>
    </div>

    <div class="content">
        {!! nl2br(e($report->content)) !!}
    </div>

    <table class="signatures">
        <tr>
            <td>
                <!-- QR Code -->
                <img src="data:image/svg+xml;base64,{{ $qrCode }}" class="qr-code">
                <div style="font-size: 10px; margin-top: 5px;">Escanee para verificar<br>autenticidad</div>
            </td>
            <td>
                <!-- Sello -->
                @if($report->doctor->tenant && $report->doctor->tenant->stamp_url)
                    <img src="{{ public_path(str_replace('/storage/', 'storage/', $report->doctor->tenant->stamp_url)) }}" class="stamp-img">
                @endif
            </td>
            <td>
                <!-- Firma -->
                @if($report->doctor->signature_url)
                    <img src="{{ public_path(str_replace('/storage/', 'storage/', $report->doctor->signature_url)) }}" class="signature-img">
                @else
                    <div style="height: 60px;"></div>
                @endif
                <div class="signature-line">
                    Dr. {{ $report->doctor->name }}<br>
                    Firma Autorizada
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Documento generado digitalmente por 58MED - La plataforma médica inteligente.<br>
        Validez comprobable mediante el código QR.
    </div>

</body>
</html>
