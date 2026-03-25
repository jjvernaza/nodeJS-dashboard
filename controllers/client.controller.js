const { Op } = require('sequelize');
const Cliente = require('../models/client.model');
const Pago = require('../models/payment.model');
const TipoServicio = require('../models/service_type.model');
const Estado = require('../models/estado.model');
const Plan = require('../models/plan_mb.model');
const Sector = require('../models/sector.model');
const Tarifa = require('../models/tarifa.model');
const XLSX = require('xlsx');

// Mapa de meses para cálculos de morosidad
const mesesMap = {
  'ENERO': 1, 'FEBRERO': 2, 'MARZO': 3, 'ABRIL': 4, 'MAYO': 5, 'JUNIO': 6,
  'JULIO': 7, 'AGOSTO': 8, 'SEPTIEMBRE': 9, 'OCTUBRE': 10, 'NOVIEMBRE': 11, 'DICIEMBRE': 12
};

function obtenerMesesVencidosDesde(fechaInicio, hoy, diaCorte) {
  const meses = [];
  let actual = new Date(fechaInicio.getFullYear(), fechaInicio.getMonth(), diaCorte);
  while (actual <= hoy) {
    meses.push([actual.getFullYear(), actual.getMonth() + 1]);
    if (actual.getMonth() === 11) {
      actual = new Date(actual.getFullYear() + 1, 0, diaCorte);
    } else {
      actual = new Date(actual.getFullYear(), actual.getMonth() + 1, diaCorte);
    }
  }
  return meses;
}

// ✅ Obtener clientes morosos (CORREGIDO con Nombre y Apellido)
exports.obtenerMorosos = async (req, res) => {
  try {
    const mesesMin = parseInt(req.query.meses || 3);
    const hoy = new Date();
    const clientes = await Cliente.findAll({
      include: [
        {
          model: Tarifa,
          as: 'tarifa'
        },
        {
          model: TipoServicio,
          as: 'tipoServicio'
        },
        {
          model: Sector,
          as: 'sector'
        }
      ]
    });

    const resultados = [];

    for (const cliente of clientes) {
      // Usar el valor de tarifa desde la relación tarifa
      if (!cliente.tarifa || cliente.tarifa.valor <= 0 || [2, 3].includes(cliente.EstadoID)) continue;

      const pagos = await Pago.findAll({
        where: { ClienteID: cliente.ID },
        order: [['Ano', 'DESC'], ['Mes', 'DESC']]
      });

      let fechaUltimoPago;
      let diaCorte = new Date(cliente.FechaInstalacion).getDate();

      if (pagos.length > 0) {
        const mes = pagos[0].Mes.toUpperCase().trim();
        const ano = pagos[0].Ano;
        if (!mesesMap[mes]) continue;

        const numMes = mesesMap[mes];
        const ultimoDiaMes = new Date(ano, numMes, 0).getDate();
        const dia = Math.min(diaCorte, ultimoDiaMes);
        fechaUltimoPago = new Date(ano, numMes - 1, dia);
      } else {
        // Si no hay pagos, la deuda empieza desde la fecha de instalación o enero 2024, lo que sea mayor
        fechaUltimoPago = new Date(cliente.FechaInstalacion);
        if (fechaUltimoPago < new Date(2024, 0, 1)) {
          fechaUltimoPago = new Date(2024, 0, diaCorte);
        }
      }

      const mesesTotales = obtenerMesesVencidosDesde(fechaUltimoPago, hoy, diaCorte);
      const mesesPagados = new Set(
        pagos.map(p => [p.Ano, mesesMap[p.Mes.toUpperCase().trim()]].toString())
      );

      const mesesDeuda = mesesTotales.filter(([y, m]) => !mesesPagados.has([y, m].toString()));

      if (mesesDeuda.length >= mesesMin) {
        resultados.push({
          ID: cliente.ID,
          Nombre: cliente.NombreCliente || '',  // ✅ CORREGIDO
          Apellido: cliente.ApellidoCliente || '',  // ✅ CORREGIDO
          NombreCompleto: `${cliente.NombreCliente || ''} ${cliente.ApellidoCliente || ''}`.trim(),
          Telefono: cliente.Telefono || '',
          Ubicacion: cliente.Ubicacion || '',
          Sector: cliente.sector?.nombre || 'Sin sector',
          FechaInstalacion: cliente.FechaInstalacion,
          MesesDeuda: mesesDeuda.length,
          MontoDeuda: mesesDeuda.length * cliente.tarifa.valor,
          TipoServicio: cliente.tipoServicio?.Tipo || 'N/A',
          Cedula: cliente.Cedula || ''
        });
      }
    }

    res.json(resultados);
  } catch (error) {
    console.error("❌ Error al obtener morosos:", error);
    res.status(500).json({ error: "Error al obtener morosos", message: error.message });
  }
};

// ✅ Agregar cliente
exports.addCliente = async (req, res) => {
    try {
        const { 
            NombreCliente, 
            ApellidoCliente,
            plan_mb_id,
            FechaInstalacion, 
            EstadoID, 
            tarifa_id,
            sector_id,
            IPAddress, 
            Telefono, 
            Ubicacion, 
            Cedula, 
            TipoServicioID 
        } = req.body;

        if (!NombreCliente || !plan_mb_id || !FechaInstalacion || !EstadoID || !tarifa_id || !sector_id || !IPAddress || !Telefono || !Ubicacion || !Cedula || !TipoServicioID) {
            return res.status(400).json({ message: 'Todos los campos son obligatorios' });
        }

        // ✅ Verificar que todas las relaciones existan
        const estadoExiste = await Estado.findByPk(EstadoID);
        const tipoServicioExiste = await TipoServicio.findByPk(TipoServicioID);
        const planExiste = await Plan.findByPk(plan_mb_id);
        const sectorExiste = await Sector.findByPk(sector_id);
        const tarifaExiste = await Tarifa.findByPk(tarifa_id);

        if (!estadoExiste) {
            return res.status(400).json({ message: 'El EstadoID proporcionado no existe.' });
        }
        if (!tipoServicioExiste) {
            return res.status(400).json({ message: 'El TipoServicioID proporcionado no existe.' });
        }
        if (!planExiste) {
            return res.status(400).json({ message: 'El plan_mb_id proporcionado no existe.' });
        }
        if (!sectorExiste) {
            return res.status(400).json({ message: 'El sector_id proporcionado no existe.' });
        }
        if (!tarifaExiste) {
            return res.status(400).json({ message: 'El tarifa_id proporcionado no existe.' });
        }

        const nuevoCliente = await Cliente.create({
            NombreCliente,
            ApellidoCliente,
            plan_mb_id,
            FechaInstalacion,
            EstadoID,
            tarifa_id,
            sector_id,
            IPAddress,
            Telefono,
            Ubicacion,
            Cedula,
            TipoServicioID
        });

        res.status(201).json({ message: 'Cliente agregado correctamente', id: nuevoCliente.ID });
    } catch (error) {
        console.error('❌ Error al agregar cliente:', error);
        res.status(500).json({ message: 'Error interno del servidor', error: error.message });
    }
};

// ✅ Buscar cliente por nombre o apellido (CORREGIDO)
exports.searchClient = async (req, res) => {
    const { nombre } = req.query;
    try {
        if (!nombre || nombre.trim() === '') {
            return res.status(400).json({ message: 'Debes proporcionar un nombre para buscar' });
        }

        const clientes = await Cliente.findAll({ 
            where: { 
                [Op.or]: [
                    { NombreCliente: { [Op.like]: `%${nombre}%` } },
                    { ApellidoCliente: { [Op.like]: `%${nombre}%` } },
                    { Cedula: { [Op.like]: `%${nombre}%` } },
                    sequelize.where(
                        sequelize.fn('CONCAT', 
                            sequelize.col('NombreCliente'), 
                            ' ', 
                            sequelize.col('ApellidoCliente')
                        ),
                        { [Op.like]: `%${nombre}%` }
                    )
                ]
            },
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado', 'Color']
                },
                {
                    model: TipoServicio,
                    as: 'tipoServicio',
                    attributes: ['ID', 'Tipo']
                },
                {
                    model: Plan,
                    as: 'plan',
                    attributes: ['id', 'nombre', 'velocidad']
                },
                {
                    model: Sector,
                    as: 'sector',
                    attributes: ['id', 'nombre', 'descripcion']
                },
                {
                    model: Tarifa,
                    as: 'tarifa',
                    attributes: ['id', 'valor']
                }
            ],
            limit: 50  // Limitar resultados para mejor rendimiento
        });

        if (!clientes || clientes.length === 0) {
            return res.status(404).json({ message: "No se encontraron clientes con ese criterio" });
        }

        res.json(clientes);
    } catch (error) {
        console.error('❌ Error en searchClient:', error);
        res.status(500).json({ message: "Error al buscar cliente", error: error.message });
    }
};

// ✅ Actualizar cliente
exports.updateClient = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await Cliente.findByPk(id);
        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }
        
        // Si se actualizan IDs de relaciones, verificar que existan
        if (req.body.EstadoID) {
            const estadoExiste = await Estado.findByPk(req.body.EstadoID);
            if (!estadoExiste) {
                return res.status(400).json({ message: 'El EstadoID proporcionado no existe.' });
            }
        }
        
        if (req.body.TipoServicioID) {
            const tipoServicioExiste = await TipoServicio.findByPk(req.body.TipoServicioID);
            if (!tipoServicioExiste) {
                return res.status(400).json({ message: 'El TipoServicioID proporcionado no existe.' });
            }
        }
        
        if (req.body.plan_mb_id) {
            const planExiste = await Plan.findByPk(req.body.plan_mb_id);
            if (!planExiste) {
                return res.status(400).json({ message: 'El plan_mb_id proporcionado no existe.' });
            }
        }
        
        if (req.body.sector_id) {
            const sectorExiste = await Sector.findByPk(req.body.sector_id);
            if (!sectorExiste) {
                return res.status(400).json({ message: 'El sector_id proporcionado no existe.' });
            }
        }
        
        if (req.body.tarifa_id) {
            const tarifaExiste = await Tarifa.findByPk(req.body.tarifa_id);
            if (!tarifaExiste) {
                return res.status(400).json({ message: 'El tarifa_id proporcionado no existe.' });
            }
        }
        
        await client.update(req.body);
        
        // Recargar el cliente con todas las relaciones
        const clienteActualizado = await Cliente.findByPk(id, {
            include: [
                { model: Estado, as: 'estado' },
                { model: TipoServicio, as: 'tipoServicio' },
                { model: Plan, as: 'plan' },
                { model: Sector, as: 'sector' },
                { model: Tarifa, as: 'tarifa' }
            ]
        });
        
        res.json(clienteActualizado);
    } catch (error) {
        console.error('❌ Error en updateClient:', error);
        res.status(500).json({ message: "Error al actualizar cliente", error: error.message });
    }
};

// ✅ Eliminar cliente
exports.deleteClient = async (req, res) => {
    const { id } = req.params;
    try {
        const client = await Cliente.findByPk(id);
        if (!client) {
            return res.status(404).json({ message: "Cliente no encontrado" });
        }

        await client.destroy();
        res.json({ message: "Cliente eliminado correctamente" });
    } catch (error) {
        console.error('❌ Error en deleteClient:', error);
        res.status(500).json({ message: "Error al eliminar cliente", error: error.message });
    }
};

// ✅ Obtener todos los clientes con TODAS las relaciones
exports.getAllClients = async (req, res) => {
    try {
        console.log('🔍 Obteniendo todos los clientes con relaciones...');
        
        const clientes = await Cliente.findAll({
            attributes: [
                'ID',
                'NombreCliente',
                'ApellidoCliente',
                'plan_mb_id',
                'FechaInstalacion',
                'TipoServicioID',
                'tarifa_id',
                'sector_id',
                'IPAddress',
                'Telefono',
                'Ubicacion',
                'Cedula',
                'EstadoID'
            ],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['ID', 'Estado', 'Color'],
                    required: false
                },
                {
                    model: TipoServicio,
                    as: 'tipoServicio',
                    attributes: ['ID', 'Tipo'],
                    required: false
                },
                {
                    model: Plan,
                    as: 'plan',
                    attributes: ['id', 'nombre', 'velocidad'],
                    required: false
                },
                {
                    model: Sector,
                    as: 'sector',
                    attributes: ['id', 'nombre', 'descripcion'],
                    required: false
                },
                {
                    model: Tarifa,
                    as: 'tarifa',
                    attributes: ['id', 'valor'],
                    required: false
                }
            ],
            order: [['ID', 'ASC']]
        });

        console.log(`✅ Se encontraron ${clientes.length} clientes`);
        
        res.json(clientes);
    } catch (error) {
        console.error("❌ Error en getAllClients:", error);
        res.status(500).json({ 
            message: "Error al obtener clientes",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ✅ Exportar clientes a Excel (CORREGIDO)
exports.exportClientsToExcel = async (req, res) => {
    try {
        console.log('📊 Generando archivo Excel de clientes...');
        
        const clientes = await Cliente.findAll({
            attributes: [
                'ID',
                'NombreCliente',
                'ApellidoCliente',
                'plan_mb_id',
                'FechaInstalacion',
                'TipoServicioID',
                'tarifa_id',
                'sector_id',
                'IPAddress',
                'Telefono',
                'Ubicacion',
                'Cedula',
                'EstadoID'
            ],
            include: [
                {
                    model: Estado,
                    as: 'estado',
                    attributes: ['Estado'],
                    required: false
                },
                {
                    model: TipoServicio,
                    as: 'tipoServicio',
                    attributes: ['Tipo'],
                    required: false
                },
                {
                    model: Plan,
                    as: 'plan',
                    attributes: ['nombre', 'velocidad'],
                    required: false
                },
                {
                    model: Sector,
                    as: 'sector',
                    attributes: ['nombre'],
                    required: false
                },
                {
                    model: Tarifa,
                    as: 'tarifa',
                    attributes: ['valor'],
                    required: false
                }
            ],
            order: [['ID', 'ASC']]
        });

        // Formatear datos para Excel
        const excelData = clientes.map(cliente => ({
            'ID': cliente.ID,
            'Nombre': cliente.NombreCliente || '',  // ✅ CORREGIDO
            'Apellido': cliente.ApellidoCliente || '',  // ✅ CORREGIDO
            'Nombre Completo': `${cliente.NombreCliente || ''} ${cliente.ApellidoCliente || ''}`.trim(),
            'Cédula': cliente.Cedula || '',
            'Plan MB': cliente.plan ? `${cliente.plan.nombre} (${cliente.plan.velocidad})` : 'Sin plan',
            'Fecha Instalación': cliente.FechaInstalacion ? 
                new Date(cliente.FechaInstalacion).toLocaleDateString('es-CO') : '',
            'Tipo de Servicio': cliente.tipoServicio ? cliente.tipoServicio.Tipo : 'Sin tipo',
            'Tarifa': cliente.tarifa ? `$${cliente.tarifa.valor.toLocaleString('es-CO')}` : '$0',
            'IP Address': cliente.IPAddress || '',
            'Teléfono': cliente.Telefono || '',
            'Ubicación': cliente.Ubicacion || '',
            'Sector': cliente.sector ? cliente.sector.nombre : 'Sin sector',
            'Estado': cliente.estado ? cliente.estado.Estado : 'Sin estado'
        }));

        // Crear libro de trabajo
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(excelData);

        // Ajustar el ancho de las columnas
        const columnWidths = [
            { wch: 5 },   // ID
            { wch: 15 },  // Nombre
            { wch: 15 },  // Apellido
            { wch: 25 },  // Nombre Completo
            { wch: 15 },  // Cédula
            { wch: 20 },  // Plan MB
            { wch: 15 },  // Fecha Instalación
            { wch: 20 },  // Tipo de Servicio
            { wch: 12 },  // Tarifa
            { wch: 15 },  // IP Address
            { wch: 15 },  // Teléfono
            { wch: 30 },  // Ubicación
            { wch: 15 },  // Sector
            { wch: 12 }   // Estado
        ];
        worksheet['!cols'] = columnWidths;

        // Agregar hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

        // Generar buffer del archivo
        const excelBuffer = XLSX.write(workbook, { 
            type: 'buffer', 
            bookType: 'xlsx' 
        });

        // Establecer headers para descarga
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `clientes_vozipcompany_${fechaActual}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
        res.setHeader('Content-Length', excelBuffer.length);

        console.log(`✅ Archivo Excel generado: ${nombreArchivo} (${clientes.length} clientes)`);
        
        // Enviar el archivo
        res.send(excelBuffer);

    } catch (error) {
        console.error("❌ Error al generar archivo Excel:", error);
        res.status(500).json({ 
            message: "Error al generar archivo Excel",
            error: error.message 
        });
    }
};

// ✅ Exportar morosos a Excel (CORREGIDO)
exports.exportMorososToExcel = async (req, res) => {
    try {
      const mesesMin = parseInt(req.query.meses || 3);
      const hoy = new Date();
  
      const clientes = await Cliente.findAll({
        include: [
          { model: Tarifa, as: 'tarifa' },
          { model: Sector, as: 'sector' },
          { model: TipoServicio, as: 'tipoServicio' }
        ]
      });
  
      const resultados = [];
  
      for (const cliente of clientes) {
        if (!cliente.tarifa || cliente.tarifa.valor <= 0 || [2, 3].includes(cliente.EstadoID)) continue;
  
        const pagos = await Pago.findAll({
          where: { ClienteID: cliente.ID },
          order: [['Ano', 'DESC'], ['Mes', 'DESC']]
        });
  
        let fechaUltimoPago;
        const diaCorte = new Date(cliente.FechaInstalacion).getDate();
  
        if (pagos.length > 0) {
          const mes = pagos[0].Mes?.toUpperCase().trim();
          const ano = pagos[0].Ano;
          if (!mes || !mesesMap[mes]) continue;
  
          const numMes = mesesMap[mes];
          const dia = Math.min(diaCorte, new Date(ano, numMes, 0).getDate());
          fechaUltimoPago = new Date(ano, numMes - 1, dia);
        } else {
          fechaUltimoPago = new Date(cliente.FechaInstalacion);
          if (fechaUltimoPago < new Date(2024, 0, 1)) {
            fechaUltimoPago = new Date(2024, 0, diaCorte);
          }
        }
  
        const mesesTotales = obtenerMesesVencidosDesde(fechaUltimoPago, hoy, diaCorte);
        const mesesPagados = new Set(pagos.map(p => [p.Ano, mesesMap[p.Mes.toUpperCase().trim()]].toString()));
        const mesesDeuda = mesesTotales.filter(([y, m]) => !mesesPagados.has([y, m].toString()));
  
        if (mesesDeuda.length >= mesesMin) {
          resultados.push({
            'ID': cliente.ID,
            'Nombre': cliente.NombreCliente || '',  // ✅ CORREGIDO
            'Apellido': cliente.ApellidoCliente || '',  // ✅ CORREGIDO
            'Nombre Completo': `${cliente.NombreCliente || ''} ${cliente.ApellidoCliente || ''}`.trim(),
            'Cédula': cliente.Cedula || '',
            'Teléfono': cliente.Telefono || '',
            'Ubicación': cliente.Ubicacion || '',
            'Sector': cliente.sector?.nombre || 'Sin sector',
            'Fecha de Instalación': new Date(cliente.FechaInstalacion).toISOString().split('T')[0],
            'Meses Deuda': mesesDeuda.length,
            'Monto Deuda': Number(mesesDeuda.length * cliente.tarifa.valor),
            'Tipo de Servicio': cliente.tipoServicio?.Tipo || 'Sin servicio'
          });
        }
      }
  
      // Crear Excel con xlsx
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(resultados);
      
      // Ajustar anchos de columnas
      worksheet['!cols'] = [
        { wch: 5 },   // ID
        { wch: 15 },  // Nombre
        { wch: 15 },  // Apellido
        { wch: 25 },  // Nombre Completo
        { wch: 15 },  // Cédula
        { wch: 15 },  // Teléfono
        { wch: 30 },  // Ubicación
        { wch: 15 },  // Sector
        { wch: 15 },  // Fecha Instalación
        { wch: 12 },  // Meses Deuda
        { wch: 15 },  // Monto Deuda
        { wch: 20 }   // Tipo Servicio
      ];
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Morosos');
  
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      const fechaActual = new Date().toISOString().split('T')[0];
      const nombreArchivo = `morosos_vozipcompany_${fechaActual}.xlsx`;

      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(buffer);
      
      console.log(`✅ Archivo Excel de morosos generado: ${nombreArchivo} (${resultados.length} clientes)`);
    } catch (error) {
      console.error('❌ Error al exportar morosos a Excel:', error.message);
      console.error(error.stack);
      res.status(500).json({ message: 'Error al generar archivo Excel', error: error.message });
    }
};

// ✅ LOGIN PORTAL CLIENTE — público, sin JWT
exports.loginCliente = async (req, res) => {
  try {
    const { cedula } = req.body;

    if (!cedula || cedula.trim() === '') {
      return res.status(400).json({ message: 'La cédula es requerida' });
    }

    const cliente = await Cliente.findOne({
      where: { Cedula: cedula.trim() },
      include: [
        { model: Estado,       as: 'estado',       attributes: ['ID', 'Estado', 'Color'] },
        { model: TipoServicio, as: 'tipoServicio',  attributes: ['ID', 'Tipo'] },
        { model: Plan,         as: 'plan',          attributes: ['id', 'nombre', 'velocidad'] },
        { model: Sector,       as: 'sector',        attributes: ['id', 'nombre'] },
        { model: Tarifa,       as: 'tarifa',        attributes: ['id', 'valor'] }
      ]
    });

    if (!cliente) {
      return res.status(404).json({ message: 'No se encontró ningún cliente con esa cédula' });
    }

    // Últimos 3 pagos
    const MetodoDePago = require('../models/metodo_pago.model');
    const ultimosPagos = await Pago.findAll({
      where: { ClienteID: cliente.ID },
      order: [['FechaPago', 'DESC'], ['ID', 'DESC']],
      limit: 3,
      include: [{ model: MetodoDePago, as: 'metodoPago', attributes: ['ID', 'Metodo'] }]
    });

    // Calcular meses de deuda
    const hoy = new Date();
    let mesesDeuda = 0;
    let proximoPago = null;

    if (cliente.tarifa && cliente.tarifa.valor > 0) {
      const todosPagos = await Pago.findAll({
        where: { ClienteID: cliente.ID },
        order: [['Ano', 'DESC'], ['Mes', 'DESC']]
      });

      const diaCorte = new Date(cliente.FechaInstalacion).getDate();
      let fechaBase;

      if (todosPagos.length > 0) {
        const ultimo  = todosPagos[0];
        const numMes  = mesesMap[ultimo.Mes.toUpperCase().trim()];
        const dia     = Math.min(diaCorte, new Date(ultimo.Ano, numMes, 0).getDate());
        fechaBase     = new Date(ultimo.Ano, numMes - 1, dia);
      } else {
        fechaBase = new Date(cliente.FechaInstalacion);
        if (fechaBase < new Date(2024, 0, 1)) {
          fechaBase = new Date(2024, 0, diaCorte);
        }
      }

      // Próxima fecha de pago
      const proxFecha = new Date(fechaBase);
      proxFecha.setMonth(proxFecha.getMonth() + 1);
      proximoPago = proxFecha.toISOString().split('T')[0];

      // Contar meses sin pagar
      const todosPagosSet = await Pago.findAll({ where: { ClienteID: cliente.ID } });
      const mesesPagados  = new Set(
        todosPagosSet.map(p => [p.Ano, mesesMap[p.Mes.toUpperCase().trim()]].toString())
      );
      const mesesTotales  = obtenerMesesVencidosDesde(fechaBase, hoy, diaCorte);
      mesesDeuda = mesesTotales.filter(
        ([y, m]) => !mesesPagados.has([y, m].toString())
      ).length;
    }

    res.json({
      cliente: {
        ID:             cliente.ID,
        NombreCompleto: `${cliente.NombreCliente} ${cliente.ApellidoCliente}`.trim(),
        NombreCliente:  cliente.NombreCliente,
        ApellidoCliente:cliente.ApellidoCliente,
        Cedula:         cliente.Cedula,
        Telefono:       cliente.Telefono,
        Ubicacion:      cliente.Ubicacion,
        FechaInstalacion: cliente.FechaInstalacion,
        IPAddress:      cliente.IPAddress,
        estado:         cliente.estado,
        tipoServicio:   cliente.tipoServicio,
        plan:           cliente.plan,
        sector:         cliente.sector,
        tarifa:         cliente.tarifa
      },
      ultimosPagos,
      mesesDeuda,
      montoDeuda:  mesesDeuda * (parseFloat(cliente.tarifa?.valor) || 0),
      proximoPago
    });

  } catch (error) {
    console.error('❌ Error en loginCliente:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};