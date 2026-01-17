import { Shipment, DepartureList, Currency, PaymentMethod } from '../types';

// Fonction helper pour les instructions selon le navigateur
const getBrowserPopupInstructions = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
    return `Chrome: Cliquez sur l'icône 🔒 dans la barre d'adresse → "Paramètres du site" → "Popups et redirections" → Autoriser`;
  } else if (userAgent.includes('firefox')) {
    return `Firefox: Cliquez sur l'icône 🛡️ dans la barre d'adresse → "Autoriser les popups pour ce site"`;
  } else if (userAgent.includes('edg') || userAgent.includes('edge')) {
    return `Edge: Cliquez sur l'icône 🔒 dans la barre d'adresse → "Permissions du site" → "Popups et redirections" → Autoriser`;
  } else if (userAgent.includes('safari')) {
    return `Safari: Safari → Préférences → Sécurité → "Bloquer les popups" → Décochez`;
  } else {
    return `Navigateur inconnu: Recherchez "autoriser popups" dans les paramètres de votre navigateur`;
  }
};

const generateReceiptCSS = `
  body { font-family: 'Courier New', monospace; width: 80mm; margin: 0; padding: 10px; font-size: 12px; color: black; }
  .header { text-align: center; margin-bottom: 20px; border-bottom: 1px dashed black; padding-bottom: 10px; }
  .logo { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
  .title { font-weight: bold; font-size: 14px; text-transform: uppercase; margin: 5px 0; }
  .info-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
  .section { margin-top: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px; }
  .total { font-weight: bold; font-size: 16px; margin-top: 10px; text-align: right; }
  .sub-total { font-size: 12px; text-align: right; margin-top: 5px; }
  .footer { margin-top: 30px; text-align: center; font-size: 10px; }
  .barcode { text-align: center; margin-top: 20px; letter-spacing: 5px; font-weight: bold; font-size: 14px; }
  .note { border: 1px solid black; padding: 5px; margin-top: 10px; font-size: 10px; font-style: italic;}
  .parcel-list { margin-top: 5px; font-size: 11px; }
  .parcel-item { margin-bottom: 2px; padding-left: 5px; border-left: 2px solid #ddd; }
`;

const generateLabelCSS = `
  body { font-family: sans-serif; width: 100mm; height: 150mm; margin: 0; padding: 15px; font-size: 14px; color: black; border: 1px solid #ddd; }
  .label-header { text-align: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 15px; }
  .big-code { font-size: 24px; font-weight: bold; }
  .route { font-size: 40px; font-weight: 900; margin: 10px 0; display: block; text-align: center; border: 3px solid black; padding: 5px;}
  .address-box { border: 1px solid black; padding: 10px; margin-bottom: 10px; }
  .label-title { font-size: 10px; text-transform: uppercase; color: #555; font-weight: bold; }
  .label-content { font-size: 16px; font-weight: bold; line-height: 1.4; }
  .meta { display: flex; justify-content: space-between; margin-top: 10px; }
  .meta-box { border: 1px solid black; padding: 5px; width: 48%; text-align: center; }
  .parcel-summary { font-size: 12px; margin-top: 10px; border-top: 1px solid #ccc; padding-top: 5px; }
`;

export const generateReceiptHTML = (shipment: Shipment, type: 'CLIENT' | 'MERCHANT'): string => {
  const currencySymbol = shipment.currency || 'MAD';
  const isPartial = shipment.advanceAmount > 0 && shipment.remainingAmount > 0;
  
  const parcelsHtml = shipment.parcels.map((p, index) => `
    <div class="parcel-item">
      - <strong>${p.count}x</strong> ${p.type === 'Autre' ? p.customType : p.type} 
      (${p.weight}kg) ${p.description ? `<br><i>${p.description}</i>` : ''}
    </div>
  `).join('');

  return `
    <html>
      <head>
        <title>Ticket ${type} - ${shipment.code}</title>
        <style>${generateReceiptCSS}</style>
      </head>
      <body>
        <div class="header">
          <div class="logo">EEM TRANSPORT</div>
          <div class="title">TICKET ${type === 'CLIENT' ? 'CLIENT' : 'AGENCE'}</div>
          <div>Agence Centrale</div>
          <div>${shipment.date || new Date().toLocaleDateString('fr-FR')}</div>
        </div>

        <div class="section">
          <div class="info-row"><span>Bon N°:</span> <strong>${shipment.code || 'N/A'}</strong></div>
          <div class="info-row"><span>Client:</span> <strong>${shipment.clientCode || 'N/A'}</strong></div>
        </div>

        <div class="section">
          <strong>EXPÉDITEUR</strong><br>
          ${shipment.senderName || 'N/A'}<br>
          ${shipment.senderPhone || 'N/A'}
        </div>

        <div class="section">
          <strong>DESTINATAIRE</strong><br>
          ${shipment.receiverName || 'N/A'}<br>
          ${shipment.receiverPhone || 'N/A'}<br>
          ${shipment.city || 'N/A'}
        </div>

        <div class="section">
          <div style="font-weight:bold; margin-bottom:5px;">DÉTAILS COLIS (${shipment.totalItems || 0} articles)</div>
          <div class="parcel-list">
            ${parcelsHtml}
          </div>
          <div class="info-row" style="margin-top:5px; border-top:1px dotted #ccc; padding-top:5px;">
            <span>Poids Total:</span> <span>${shipment.totalWeight || 0} kg</span>
          </div>
        </div>
        
        ${shipment.note ? `<div class="note">Note: ${shipment.note}</div>` : ''}

        <div class="section">
          <div class="total">
            TOTAL: ${(shipment.price || 0).toFixed(2)} ${currencySymbol}
          </div>
          ${isPartial ? `
            <div class="sub-total">Encaissement: ${(shipment.advanceAmount || 0).toFixed(2)} ${currencySymbol}</div>
            <div class="sub-total">RESTE: ${(shipment.remainingAmount || 0).toFixed(2)} ${currencySymbol}</div>
          ` : ''}
           <div class="sub-total" style="margin-top:10px; font-style:italic;">Mode: ${shipment.paymentMethod || 'N/A'}</div>
        </div>

        <div class="barcode">
          *${shipment.code}*
        </div>

        <div class="footer">
          ${type === 'CLIENT' ? 'Merci de votre confiance.' : 'Copie Agence - À conserver'}
        </div>
      </body>
    </html>
  `;
};

export const generateLabelHTML = (shipment: Shipment): string => {
  const parcelsSummary = shipment.parcels.map(p => 
    `${p.count}x ${p.type === 'Autre' ? p.customType : p.type}`
  ).join(', ');

  return `
    <html>
      <head>
        <title>Label - ${shipment.code}</title>
        <style>${generateLabelCSS}</style>
      </head>
      <body>
        <div class="label-header">
          <div style="font-size: 14px; font-weight: bold;">EEM TRANSPORT</div>
          <div class="big-code">${shipment.code}</div>
        </div>

        <div class="route">${shipment.city.toUpperCase()}</div>

        <div class="address-box">
          <div class="label-title">DESTINATAIRE</div>
          <div class="label-content">
            ${shipment.receiverName}<br>
            ${shipment.receiverPhone}<br>
            <span style="font-size: 14px; font-weight: normal;">${shipment.receiverAddress}</span>
          </div>
        </div>

        <div class="address-box">
          <div class="label-title">EXPÉDITEUR</div>
          <div style="font-size: 12px;">
            ${shipment.senderName} (${shipment.senderPhone})
          </div>
        </div>

        <div class="meta">
          <div class="meta-box">
            <div class="label-title">POIDS TOTAL</div>
            <div class="label-content">${shipment.totalWeight} KG</div>
          </div>
          <div class="meta-box">
            <div class="label-title">TOTAL COLIS</div>
            <div class="label-content">${shipment.totalItems}</div>
          </div>
        </div>

        <div class="parcel-summary">
          <strong>Contenu:</strong> ${parcelsSummary}
        </div>

        <div style="margin-top: 15px; text-align: center;">
           ${shipment.remainingAmount > 0 
             ? `<div style="border: 2px solid black; padding: 5px; font-weight: bold; font-size: 18px;">CRBT: ${shipment.remainingAmount} ${shipment.currency}</div>` 
             : '<div style="border: 1px solid black; padding: 5px;">PORT PAYÉ</div>'}
        </div>
        <div style="text-align: center; margin-top: 10px; font-size: 10px;">${shipment.date}</div>
      </body>
    </html>
  `;
}

const generateDriverManifestHTML = (list: DepartureList): string => {
  console.log('generateDriverManifestHTML - Liste reçue:', list);
  console.log('generateDriverManifestHTML - Shipments:', list.shipments);

  // Validation des données
  if (!list || !list.shipments || list.shipments.length === 0) {
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Erreur - Liste de Départ</title></head>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: red;">Erreur: Liste vide</h1>
        <p>Cette liste de départ ne contient aucun colis.</p>
        <p>Veuillez vérifier que des colis ont été sélectionnés avant de valider la liste.</p>
      </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Liste Chauffeur - ${list.code}</title>
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #000; -webkit-print-color-adjust: exact; }
        .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .logo { font-size: 24px; font-weight: 900; color: #000; }
        .info-box { text-align: right; }
        .info-title { font-size: 18px; font-weight: bold; text-transform: uppercase; }
        .info-sub { font-size: 12px; margin-top: 2px; }

        .trip-info { display: flex; gap: 20px; background: #f3f3f3; padding: 10px; border: 1px solid #ccc; margin-bottom: 15px; }
        .trip-item { flex: 1; }
        .trip-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #555; }
        .trip-value { font-size: 14px; font-weight: bold; }

        table { width: 100%; border-collapse: collapse; }
        th { background-color: #eee; color: #000; text-align: left; padding: 8px 5px; border: 1px solid #999; font-size: 10px; text-transform: uppercase; font-weight: 800; }
        td { border: 1px solid #bbb; padding: 6px 5px; vertical-align: middle; font-size: 11px; }
        tr:nth-child(even) { background-color: #f9f9f9; }

        .col-price { text-align: right; font-weight: bold; width: 150px; }
        .col-center { text-align: center; }

        .footer-stats { margin-top: 20px; display: flex; justify-content: flex-end; gap: 40px; border-top: 3px solid #000; padding-top: 15px; }
        .stat-box { text-align: right; border: 2px solid #000; padding: 10px 20px; min-width: 150px; background: #fff; }
        .stat-label { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #444; }
        .stat-value { font-size: 20px; font-weight: 900; }

        .legal { margin-top: 40px; font-size: 9px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">EEM TRANSPORT</div>
        <div class="info-box">
          <div class="info-title">LISTE DE DÉPART</div>
          <div class="info-sub">Réf: <strong>${list.code || 'N/A'}</strong></div>
          <div class="info-sub">Date: ${list.date || 'N/A'}</div>
        </div>
      </div>

      <div class="trip-info">
        <div class="trip-item">
          <div class="trip-label">Prestataire / Chauffeur</div>
          <div class="trip-value">${list.driverName || 'N/A'} ${list.driverPhone ? `(${list.driverPhone})` : ''}</div>
        </div>
        <div class="trip-item">
          <div class="trip-label">Destination</div>
          <div class="trip-value">${list.destination || 'Non spécifiée'}</div>
        </div>
        <div class="trip-item" style="text-align: right;">
          <div class="trip-label">Nombre de Colis</div>
          <div class="trip-value">${list.itemCount || 0}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 100px;">Code Bon</th>
            <th style="width: 100px;">Ville</th>
            <th style="width: 150px;">Expéditeur</th>
            <th style="width: 150px;">Destinataire</th>
            <th>Adresse / Détails</th>
            <th class="col-price">À ENCAISSER</th>
          </tr>
        </thead>
        <tbody>
          ${list.shipments.map(s => {
            console.log('Traitement shipment:', s);

            const isCash = s.paymentMethod === PaymentMethod.CASH;
            const isMAD = s.currency === Currency.MAD;
            const isEUR = s.currency === Currency.EUR;

            // Discount logic applies to Cash payments only for the driver net amount
            // Bank payments are not collected by driver, so they show as 0 or '-'
            const netPrice = isCash ? (s.price || 0) * (1 - (list.discountPercentage || 0) / 100) : 0;

            const driverMAD = (isCash && isMAD) ? netPrice : 0;
            const driverEUR = (isCash && isEUR) ? netPrice : 0;

            let priceDisplay = "-";
            if (driverMAD > 0) priceDisplay = `${driverMAD.toFixed(2)} MAD`;
            else if (driverEUR > 0) priceDisplay = `${driverEUR.toFixed(2)} EUR`;

            return `
              <tr>
                <td style="font-weight: bold;">${s.code || 'N/A'}</td>
                <td>${s.city || 'N/A'}</td>
                <td>
                  <strong>${s.senderName || 'N/A'}</strong><br>
                  <span style="color: #666; font-size: 9px;">${s.senderPhone || 'N/A'}</span>
                </td>
                <td>
                  <strong>${s.receiverName || 'N/A'}</strong><br>
                  <span style="color: #666; font-size: 9px;">${s.receiverPhone || 'N/A'}</span>
                </td>
                <td>
                  ${s.receiverAddress || 'N/A'}<br>
                  <span style="font-size: 9px; color: #555;">
                     ${(s.parcels && s.parcels.length > 0) ? s.parcels.map(p => `${p.count || 0}x ${p.type === 'Autre' ? (p.customType || 'Autre') : (p.type || 'N/A')}`).join(', ') : 'Aucun colis'}
                  </span>
                </td>
                <td class="col-price">${priceDisplay}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="footer-stats">
        <div class="stat-box">
          <div class="stat-label">TOTAL À ENCAISSER (MAD)</div>
          <div class="stat-value">${(list.totalDriverMAD || 0).toFixed(2)}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">TOTAL À ENCAISSER (EUR)</div>
          <div class="stat-value">${(list.totalDriverEUR || 0).toFixed(2)}</div>
        </div>
      </div>

      <div class="legal">
        Document confidentiel à usage interne et prestataire. Veuillez vérifier les colis avant départ.
      </div>
    </body>
    </html>
  `;
};

export const printReceipt = (shipment: Shipment, type: 'CLIENT' | 'MERCHANT' = 'CLIENT') => {
  try {
    const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
    if (!printWindow) {
      const browserInstructions = getBrowserPopupInstructions();
      alert(`Les popups sont bloquées par votre navigateur.\n\n${browserInstructions}\n\nAprès avoir autorisé les popups, actualisez la page et réessayez.`);
      return;
    }

    const html = generateReceiptHTML(shipment, type);
    
    // Use innerHTML instead of write for better compatibility
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    const printContent = () => {
      try {
        printWindow.print();
      } catch (error) {
        console.error('Erreur lors de l\'impression:', error);
        alert('Erreur lors de l\'impression. Veuillez réessayer.');
      }
    };

    // Vérifier si le document est prêt
    if (printWindow.document.readyState === 'complete') {
      setTimeout(printContent, 500);
    } else {
      printWindow.onload = function() {
        setTimeout(printContent, 500);
      };
      
      // Fallback si onload ne se déclenche pas
      setTimeout(() => {
        if (printWindow && !printWindow.closed) {
          printContent();
        }
      }, 2000);
    }

  } catch (error) {
    console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error);
    alert('Erreur lors de l\'ouverture de la fenêtre d\'impression. Vérifiez que les popups sont autorisés.');
  }
};
    console.error('Erreur lors de l\'ouverture de la fenêtre d\'impression:', error);
    alert('Erreur lors de l\'ouverture de la fenêtre d\'impression. Vérifiez que les popups sont autorisés.');
  }
};

export const printLabel = (shipment: Shipment) => {
  try {
    const labelWindow = window.open('', '_blank', 'width=500,height=800,scrollbars=yes,resizable=yes');
    if (!labelWindow) {
      const browserInstructions = getBrowserPopupInstructions();
      alert(`Les popups sont bloquées par votre navigateur.\n\n${browserInstructions}\n\nAprès avoir autorisé les popups, actualisez la page et réessayez.`);
      return;
    }

    const html = generateLabelHTML(shipment);
    labelWindow.document.open();
    labelWindow.document.write(html);
    labelWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    const printContent = () => {
      try {
        labelWindow.print();
      } catch (error) {
        console.error('Erreur lors de l\'impression de l\'étiquette:', error);
        alert('Erreur lors de l\'impression de l\'étiquette. Veuillez réessayer.');
      }
    };

    // Vérifier si le document est prêt
    if (labelWindow.document.readyState === 'complete') {
      setTimeout(printContent, 500);
    } else {
      labelWindow.onload = function() {
        setTimeout(printContent, 500);
      };
      
      // Fallback si onload ne se déclenche pas
      setTimeout(() => {
        if (labelWindow && !labelWindow.closed) {
          printContent();
        }
      }, 2000);
    }

  } catch (error) {
    console.error('Erreur lors de l\'ouverture de la fenêtre d\'étiquette:', error);
    alert('Erreur lors de l\'ouverture de la fenêtre d\'étiquette. Vérifiez que les popups sont autorisés.');
  }
}

export const printDepartureList = (list: DepartureList) => {
  try {
    // Debug: vérifier les données reçues
    console.log('printDepartureList - Données reçues:', list);
    console.log('printDepartureList - Shipments:', list.shipments);
    console.log('printDepartureList - Nombre de shipments:', list.shipments?.length || 0);

    if (!list.shipments || list.shipments.length === 0) {
      alert('Erreur: La liste de départ ne contient aucun colis. Veuillez ajouter des colis avant d\'imprimer.');
      return;
    }

    // Essayer d'abord avec une popup
    let printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');

    if (!printWindow) {
      // Si les popups sont bloquées, essayer avec un nouvel onglet simple
      console.warn('Popups bloquées, tentative avec nouvel onglet...');
      printWindow = window.open('', '_blank');

      if (!printWindow) {
        // Si toujours bloqué, afficher des instructions détaillées
        const browserInstructions = getBrowserPopupInstructions();
        alert(`Les popups sont bloquées par votre navigateur.\n\n${browserInstructions}\n\nAprès avoir autorisé les popups, actualisez la page et réessayez.`);
        return;
      }
    }

    const html = generateDriverManifestHTML(list);
    console.log('printDepartureList - HTML généré, longueur:', html.length);

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    // Attendre que le contenu soit chargé avant d'imprimer
    printWindow.onload = function() {
      setTimeout(() => {
        try {
          console.log('printDepartureList - Tentative d\'impression');
          printWindow.print();
          // Ne pas fermer automatiquement pour permettre la réimpression
        } catch (error) {
          console.error('Erreur lors de l\'impression de la liste de départ:', error);
          alert('Erreur lors de l\'impression de la liste de départ. Veuillez réessayer.');
        }
      }, 500);
    };

    // Fallback si onload ne se déclenche pas
    setTimeout(() => {
      if (printWindow && !printWindow.closed) {
        try {
          console.log('printDepartureList - Fallback d\'impression');
          printWindow.print();
        } catch (error) {
          console.error('Erreur lors de l\'impression de la liste de départ (fallback):', error);
        }
      }
    }, 2000);

  } catch (error) {
    console.error('Erreur lors de l\'ouverture de la fenêtre de liste de départ:', error);
    alert('Erreur lors de l\'ouverture de la fenêtre de liste de départ. Vérifiez que les popups sont autorisés.');
  }
};