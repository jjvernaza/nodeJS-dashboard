const Bitacora = require('../models/bitacora.model');
const User = require('../models/user.model');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');

/**
 * Obtener todos los registros de bitácora con filtros
 */
exports.getAllBitacora = async (req, res) => {
    try {
        const { 
            usuario_id, 
            modulo, 
            accion, 
            fecha_inicio, 
            fecha_fin,
            busqueda,
            limit = 100,
            offset = 0 
        } = req.query;

        const whereClause = {};

        if (usuario_id) whereClause.usuario_id = usuario_id;
        if (modulo) whereClause.modulo = modulo;
        if (accion) whereClause.accion = accion;
        
        if (fecha_inicio || fecha_fin) {
            whereClause.fecha_hora = {};
            if (fecha_inicio) {
                const fechaInicio = new Date(fecha_inicio);
                fechaInicio.setHours(0, 0, 0, 0);
                whereClause.fecha_hora[Op.gte] = fechaInicio;
            }
            if (fecha_fin) {
                const fechaFin = new Date(fecha_fin);
                fechaFin.setHours(23, 59, 59, 999);
                whereClause.fecha_hora[Op.lte] = fechaFin;
            }
        }

        // Búsqueda en descripción
        if (busqueda) {
            whereClause.descripcion = {
                [Op.like]: `%${busqueda}%`
            };
        }

        const registros = await Bitacora.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['ID', 'Nombre', 'Apellidos', 'User']
                }
            ],
            order: [['fecha_hora', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const total = await Bitacora.count({ where: whereClause });

        console.log(`✅ Bitácora obtenida: ${registros.length} registros de ${total} totales`);

        res.json({
            registros,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        });
    } catch (error) {
        console.error('❌ Error al obtener bitácora:', error);
        res.status(500).json({ 
            message: 'Error al obtener registros de bitácora', 
            error: error.message 
        });
    }
};

/**
 * Obtener bitácora de un usuario específico
 */
exports.getBitacoraByUsuario = async (req, res) => {
    try {
        const { usuario_id } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const registros = await Bitacora.findAll({
            where: { usuario_id },
            include: [
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['ID', 'Nombre', 'Apellidos', 'User']
                }
            ],
            order: [['fecha_hora', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        const total = await Bitacora.count({ where: { usuario_id } });

        res.json({
            registros,
            total,
            hasMore: (parseInt(offset) + parseInt(limit)) < total
        });
    } catch (error) {
        console.error('❌ Error al obtener bitácora del usuario:', error);
        res.status(500).json({ 
            message: 'Error al obtener bitácora del usuario', 
            error: error.message 
        });
    }
};

/**
 * Obtener estadísticas de la bitácora
 */
exports.getEstadisticas = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;

        const whereClause = {};
        if (fecha_inicio || fecha_fin) {
            whereClause.fecha_hora = {};
            if (fecha_inicio) {
                const fechaInicio = new Date(fecha_inicio);
                fechaInicio.setHours(0, 0, 0, 0);
                whereClause.fecha_hora[Op.gte] = fechaInicio;
            }
            if (fecha_fin) {
                const fechaFin = new Date(fecha_fin);
                fechaFin.setHours(23, 59, 59, 999);
                whereClause.fecha_hora[Op.lte] = fechaFin;
            }
        }

        // Total de acciones
        const totalAcciones = await Bitacora.count({ where: whereClause });

        // Acciones por módulo
        const accionesPorModulo = await Bitacora.findAll({
            where: whereClause,
            attributes: [
                'modulo',
                [Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('id')), 'total']
            ],
            group: ['modulo'],
            order: [[Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('id')), 'DESC']],
            raw: true
        });

        // Acciones por tipo
        const accionesPorTipo = await Bitacora.findAll({
            where: whereClause,
            attributes: [
                'accion',
                [Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('id')), 'total']
            ],
            group: ['accion'],
            order: [[Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('id')), 'DESC']],
            raw: true
        });

        // Usuarios más activos - CORREGIDO
        const usuariosMasActivos = await Bitacora.findAll({
            where: whereClause,
            attributes: [
                'usuario_id',
                [Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('Bitacora.id')), 'total']
            ],
            include: [
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['ID', 'Nombre', 'Apellidos', 'User']
                }
            ],
            group: ['usuario_id', 'usuario.ID', 'usuario.Nombre', 'usuario.Apellidos', 'usuario.User'],
            order: [[Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('Bitacora.id')), 'DESC']],
            limit: 10
        });

        // Actividad por día (últimos 7 días)
        const hace7Dias = new Date();
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        
        const actividadPorDia = await Bitacora.findAll({
            where: {
                ...whereClause,
                fecha_hora: {
                    [Op.gte]: hace7Dias
                }
            },
            attributes: [
                [Bitacora.sequelize.fn('DATE', Bitacora.sequelize.col('fecha_hora')), 'fecha'],
                [Bitacora.sequelize.fn('COUNT', Bitacora.sequelize.col('id')), 'total']
            ],
            group: [Bitacora.sequelize.fn('DATE', Bitacora.sequelize.col('fecha_hora'))],
            order: [[Bitacora.sequelize.fn('DATE', Bitacora.sequelize.col('fecha_hora')), 'ASC']],
            raw: true
        });

        res.json({
            totalAcciones,
            accionesPorModulo,
            accionesPorTipo,
            usuariosMasActivos,
            actividadPorDia
        });
    } catch (error) {
        console.error('❌ Error al obtener estadísticas:', error);
        res.status(500).json({ 
            message: 'Error al obtener estadísticas', 
            error: error.message 
        });
    }
};

/**
 * Exportar bitácora a Excel
 */
exports.exportarBitacora = async (req, res) => {
    try {
        const { 
            usuario_id, 
            modulo, 
            accion, 
            fecha_inicio, 
            fecha_fin 
        } = req.query;

        const whereClause = {};

        if (usuario_id) whereClause.usuario_id = usuario_id;
        if (modulo) whereClause.modulo = modulo;
        if (accion) whereClause.accion = accion;
        
        if (fecha_inicio || fecha_fin) {
            whereClause.fecha_hora = {};
            if (fecha_inicio) {
                const fechaInicio = new Date(fecha_inicio);
                fechaInicio.setHours(0, 0, 0, 0);
                whereClause.fecha_hora[Op.gte] = fechaInicio;
            }
            if (fecha_fin) {
                const fechaFin = new Date(fecha_fin);
                fechaFin.setHours(23, 59, 59, 999);
                whereClause.fecha_hora[Op.lte] = fechaFin;
            }
        }

        const registros = await Bitacora.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'usuario',
                    attributes: ['ID', 'Nombre', 'Apellidos', 'User']
                }
            ],
            order: [['fecha_hora', 'DESC']],
            limit: 10000 // Límite para exportación
        });

        // Crear libro de Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Bitácora');

        // Definir columnas
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Fecha y Hora', key: 'fecha_hora', width: 20 },
            { header: 'Usuario ID', key: 'usuario_id', width: 12 },
            { header: 'Usuario', key: 'usuario_nombre', width: 25 },
            { header: 'Acción', key: 'accion', width: 15 },
            { header: 'Módulo', key: 'modulo', width: 20 },
            { header: 'Descripción', key: 'descripcion', width: 50 },
            { header: 'IP', key: 'ip_address', width: 15 }
        ];

        // Estilo del encabezado
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4472C4' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Agregar datos
        registros.forEach(registro => {
            worksheet.addRow({
                id: registro.id,
                fecha_hora: new Date(registro.fecha_hora).toLocaleString('es-CO'),
                usuario_id: registro.usuario_id,
                usuario_nombre: registro.usuario 
                    ? `${registro.usuario.Nombre} ${registro.usuario.Apellidos}` 
                    : 'Desconocido',
                accion: registro.accion,
                modulo: registro.modulo,
                descripcion: registro.descripcion,
                ip_address: registro.ip_address
            });
        });

        // Configurar respuesta
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=bitacora_${new Date().toISOString().split('T')[0]}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();

        console.log(`✅ Bitácora exportada: ${registros.length} registros`);
    } catch (error) {
        console.error('❌ Error al exportar bitácora:', error);
        res.status(500).json({ 
            message: 'Error al exportar bitácora', 
            error: error.message 
        });
    }
};

/**
 * Obtener módulos disponibles
 */
exports.getModulos = async (req, res) => {
    try {
        const modulos = await Bitacora.findAll({
            attributes: [
                [Bitacora.sequelize.fn('DISTINCT', Bitacora.sequelize.col('modulo')), 'modulo']
            ],
            raw: true
        });

        res.json(modulos.map(m => m.modulo).sort());
    } catch (error) {
        console.error('❌ Error al obtener módulos:', error);
        res.status(500).json({ 
            message: 'Error al obtener módulos', 
            error: error.message 
        });
    }
};

/**
 * Obtener tipos de acciones disponibles
 */
exports.getAcciones = async (req, res) => {
    try {
        const acciones = await Bitacora.findAll({
            attributes: [
                [Bitacora.sequelize.fn('DISTINCT', Bitacora.sequelize.col('accion')), 'accion']
            ],
            raw: true
        });

        res.json(acciones.map(a => a.accion).sort());
    } catch (error) {
        console.error('❌ Error al obtener acciones:', error);
        res.status(500).json({ 
            message: 'Error al obtener acciones', 
            error: error.message 
        });
    }
};

/**
 * Limpiar registros antiguos (mantenimiento)
 */
exports.limpiarRegistrosAntiguos = async (req, res) => {
    try {
        const { dias = 90 } = req.query;
        
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - parseInt(dias));

        const eliminados = await Bitacora.destroy({
            where: {
                fecha_hora: {
                    [Op.lt]: fechaLimite
                }
            }
        });

        console.log(`🗑️ Limpieza de bitácora: ${eliminados} registros eliminados`);

        res.json({ 
            message: `Se eliminaron ${eliminados} registros anteriores a ${fechaLimite.toLocaleDateString('es-CO')}`,
            eliminados,
            fechaLimite: fechaLimite.toISOString()
        });
    } catch (error) {
        console.error('❌ Error al limpiar registros:', error);
        res.status(500).json({ 
            message: 'Error al limpiar registros', 
            error: error.message 
        });
    }
};