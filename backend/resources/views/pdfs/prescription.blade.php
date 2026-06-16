<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receta Médica</title>
    <style>
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #333; line-height: 1.5; font-size: 14px; }
        .header { border-bottom: 2px solid #2FA4A5; padding-bottom: 20px; margin-bottom: 30px; }
        .header-table { width: 100%; }
        .logo { max-width: 150px; max-height: 80px; }
        .doctor-info { text-align: right; }
        .doctor-name { font-size: 20px; font-weight: bold; color: #2FA4A5; margin: 0; }
        .patient-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
        .patient-info table { width: 100%; }
        .title { text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
        .medications { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .medications th { text-align: left; background: #2FA4A5; color: white; padding: 10px; }
        .medications td { border-bottom: 1px solid #eee; padding: 10px; }
        .instructions { background: #f8f9fa; padding: 15px; border-left: 4px solid #2FA4A5; margin-bottom: 40px; }
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
                    @if($prescription->doctor->tenant && $prescription->doctor->tenant->logo_url)
                        <img src="{{ public_path(str_replace('/storage/', 'storage/', $prescription->doctor->tenant->logo_url)) }}" class="logo">
                    @else
                        <h2 style="color: #2FA4A5; margin: 0;">58MED</h2>
                    @endif
                </td>
                <td class="doctor-info">
                    <h3 class="doctor-name">Dr. {{ $prescription->doctor->name }}</h3>
                    <div>{{ $prescription->doctor->specialty ?? 'Médico General' }}</div>
                    @if($prescription->doctor->medical_license)
                        <div>MPPS / Licencia: {{ $prescription->doctor->medical_license }}</div>
                    @endif
                    @if($prescription->doctor->college_number)
                        <div>Colegio: {{ $prescription->doctor->college_number }}</div>
                    @endif
                </td>
            </tr>
        </table>
    </div>

    <div class="patient-info">
        <table>
            <tr>
                <td width="50%"><strong>Paciente:</strong> {{ $prescription->patient->name }}</td>
                <td width="50%" style="text-align: right;"><strong>Fecha:</strong> {{ $prescription->created_at->format('d/m/Y') }}</td>
            </tr>
            <tr>
                <td><strong>C.I / DNI:</strong> {{ $prescription->patient->dni ?? 'N/A' }}</td>
                <td style="text-align: right;"><strong>Receta #:</strong> {{ str_pad($prescription->id, 6, '0', STR_PAD_LEFT) }}</td>
            </tr>
        </table>
    </div>

    <div class="title">Rp / Indicaciones</div>

    <table class="medications">
        <thead>
            <tr>
                <th width="30%">Medicamento</th>
                <th width="20%">Dosis</th>
                <th width="30%">Frecuencia</th>
                <th width="20%">Duración</th>
            </tr>
        </thead>
        <tbody>
            @foreach($prescription->medications as $med)
                <tr>
                    <td><strong>{{ $med['name'] ?? '' }}</strong></td>
                    <td>{{ $med['dose'] ?? '' }}</td>
                    <td>{{ $med['frequency'] ?? '' }}</td>
                    <td>{{ $med['duration'] ?? '' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    @if($prescription->general_instructions)
        <div style="margin-bottom: 10px;"><strong>Indicaciones Generales:</strong></div>
        <div class="instructions">
            {!! nl2br(e($prescription->general_instructions)) !!}
        </div>
    @endif

    <table class="signatures">
        <tr>
            <td>
                <!-- QR Code -->
                <img src="data:image/svg+xml;base64,{{ $qrCode }}" class="qr-code">
                <div style="font-size: 10px; margin-top: 5px;">Escanee para verificar<br>autenticidad</div>
            </td>
            <td>
                <!-- Sello -->
                @if($prescription->doctor->tenant && $prescription->doctor->tenant->stamp_url)
                    <img src="{{ public_path(str_replace('/storage/', 'storage/', $prescription->doctor->tenant->stamp_url)) }}" class="stamp-img">
                @endif
            </td>
            <td>
                <!-- Firma -->
                @if($prescription->doctor->signature_url)
                    <img src="{{ public_path(str_replace('/storage/', 'storage/', $prescription->doctor->signature_url)) }}" class="signature-img">
                @else
                    <div style="height: 60px;"></div>
                @endif
                <div class="signature-line">
                    Dr. {{ $prescription->doctor->name }}<br>
                    Firma Autorizada
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">
        Documento generado digitalmente por 58MED - La plataforma médica inteligente.<br>
        Las firmas y sellos presentes tienen validez digital comprobable mediante el código QR.
    </div>

</body>
</html>
