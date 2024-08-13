const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbconnect = require('./config'); // Ajusta la ruta si es necesario
const ModelUser = require('./userMode');
const ModelProducts = require('./productMode');
const ModelOrder = require('./orderMode');
const ModelCustomer = require('./customerMode');
const ModelRawMaterial = require('./materiaPrimaMode');

const app = express();
const port = 3001;
const secretKey = 'your_secret_key'; // Cambia esto a una clave secreta más segura

// Routers para usuarios
const userRouter = express.Router();

userRouter.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Verifica si el usuario ya existe
        const existingUser = await ModelUser.findOne({ email });
        if (existingUser) {
            return res.status(400).send("El correo ya está registrado");
        }

        // Encripta la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crea el nuevo usuario con la contraseña encriptada
        const newUser = await ModelUser.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).send(newUser);
    } catch (error) {
        res.status(500).send("Error al registrar el usuario");
    }
});

userRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Busca al usuario por su correo
        const user = await ModelUser.findOne({ email });
        if (!user) {
            return res.status(401).send("Usuario no encontrado");
        }

        // Compara la contraseña proporcionada con la almacenada
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send("Contraseña incorrecta");
        }

        // Genera el token JWT
        const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
        res.send({ token });
    } catch (error) {
        res.status(500).send("Error en el inicio de sesión");
    }
});

// Routers para productos
const productRouter = express.Router();
productRouter.post("/", async (req, res) => {
    const body = req.body;
    const respuesta = await ModelProducts.create(body);
    res.send(respuesta);
});
productRouter.get("/", async (req, res) => {
    const respuesta = await ModelProducts.find({});
    res.send(respuesta);
});
productRouter.get("/:id", async (req, res) => {
    const id = req.params.id;
    const respuesta = await ModelProducts.findById(id);
    res.send(respuesta);
});
productRouter.put("/:id", async (req, res) => {
    const body = req.body;
    const id = req.params.id;
    const respuesta = await ModelProducts.findByIdAndUpdate({ _id: id }, body, { new: true });
    res.send(respuesta);
});
productRouter.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const respuesta = await ModelProducts.deleteOne({ _id: id });
    res.send(respuesta);
});

// Routers para órdenes
const orderRouter = express.Router();

// Crear una nueva orden
orderRouter.post("/", async (req, res) => {
    try {
        const { productos, materiaPrima, ...orderData } = req.body;

        // Crea el pedido
        const newOrder = await ModelOrder.create(orderData);

        // Actualiza el stock de productos
        for (let producto of productos) {
            const { productId, cantidad } = producto;
            const existingProduct = await ModelProducts.findById(productId);
            if (existingProduct) {
                if (existingProduct.stock < cantidad) {
                    return res.status(400).send(`No hay suficiente stock para el producto ${productId}`);
                }
                existingProduct.stock -= cantidad;
                await existingProduct.save();
            } else {
                return res.status(404).send(`Producto ${productId} no encontrado`);
            }
        }

        // Actualiza la materia prima
        for (let material of materiaPrima) {
            const { materialId, cantidad } = material;
            const existingMaterial = await ModelRawMaterial.findById(materialId);
            if (existingMaterial) {
                if (existingMaterial.cantidadRecibida < cantidad) {
                    return res.status(400).send(`No hay suficiente materia prima para ${materialId}`);
                }
                existingMaterial.cantidadRecibida -= cantidad;
                await existingMaterial.save();
            } else {
                return res.status(404).send(`Materia prima ${materialId} no encontrada`);
            }
        }

        res.status(201).send(newOrder);
    } catch (error) {
        res.status(500).send("Error al procesar el pedido");
    }
});

// Obtener todas las órdenes
orderRouter.get("/", async (req, res) => {
    try {
        const orders = await ModelOrder.find({})
            .populate('productos.productId') // Opcional: para incluir información del producto
            .populate('materiaPrima.materialId'); // Opcional: para incluir información de materia prima
        res.send(orders);
    } catch (error) {
        res.status(500).send("Error al obtener las órdenes");
    }
});

// Obtener una orden por ID
orderRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const order = await ModelOrder.findById(id)
            .populate('productos.productId') // Opcional: para incluir información del producto
            .populate('materiaPrima.materialId'); // Opcional: para incluir información de materia prima
        if (order) {
            res.send(order);
        } else {
            res.status(404).send("Orden no encontrada");
        }
    } catch (error) {
        res.status(500).send("Error al obtener la orden");
    }
});

// Actualizar una orden por ID
orderRouter.put("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body;
        const updatedOrder = await ModelOrder.findByIdAndUpdate(id, body, { new: true })
            .populate('productos.productId') // Opcional: para incluir información del producto
            .populate('materiaPrima.materialId'); // Opcional: para incluir información de materia prima
        if (updatedOrder) {
            res.send(updatedOrder);
        } else {
            res.status(404).send("Orden no encontrada");
        }
    } catch (error) {
        res.status(500).send("Error al actualizar la orden");
    }
});

// Eliminar una orden por ID
orderRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const deletedOrder = await ModelOrder.findByIdAndDelete(id);
        if (deletedOrder) {
            res.send("Orden eliminada exitosamente");
        } else {
            res.status(404).send("Orden no encontrada");
        }
    } catch (error) {
        res.status(500).send("Error al eliminar la orden");
    }
});

// Routers para clientes
const customerRouter = express.Router();
customerRouter.post("/", async (req, res) => {
    const body = req.body;
    const respuesta = await ModelCustomer.create(body);
    res.send(respuesta);
});
customerRouter.get("/", async (req, res) => {
    const respuesta = await ModelCustomer.find({});
    res.send(respuesta);
});
customerRouter.get("/:id", async (req, res) => {
    const id = req.params.id;
    const respuesta = await ModelCustomer.findById(id);
    res.send(respuesta);
});
customerRouter.put("/:id", async (req, res) => {
    const body = req.body;
    const id = req.params.id;
    const respuesta = await ModelCustomer.findByIdAndUpdate({ _id: id }, body, { new: true });
    res.send(respuesta);
});
customerRouter.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const respuesta = await ModelCustomer.deleteOne({ _id: id });
    res.send(respuesta);
});

// Routers para materia prima
const materialPrimaRouter = express.Router();
materialPrimaRouter.post("/", async (req, res) => {
    const body = req.body;
    const respuesta = await ModelRawMaterial.create(body);
    res.send(respuesta);
});
materialPrimaRouter.get("/", async (req, res) => {
    const respuesta = await ModelRawMaterial.find({});
    res.send(respuesta);
});
materialPrimaRouter.get("/:id", async (req, res) => {
    const id = req.params.id;
    const respuesta = await ModelRawMaterial.findById(id);
    res.send(respuesta);
});
materialPrimaRouter.put("/:id", async (req, res) => {
    const body = req.body;
    const id = req.params.id;
    const respuesta = await ModelRawMaterial.findByIdAndUpdate({ _id: id }, body, { new: true });
    res.send(respuesta);
});
materialPrimaRouter.delete("/:id", async (req, res) => {
    const id = req.params.id;
    const respuesta = await ModelRawMaterial.deleteOne({ _id: id });
    res.send(respuesta);
});

// Conectar a la base de datos
dbconnect();

app.use(express.json());
app.use('/users', userRouter); // Usa '/users' para las rutas de usuarios
app.use('/products', productRouter); // Usa '/products' para las rutas de productos
app.use('/orders', orderRouter); // Usa '/orders' para las rutas de órdenes
app.use('/customers', customerRouter); // Usa '/customers' para las rutas de clientes
app.use('/materialPrima', materialPrimaRouter); // Usa '/materialPrima' para las rutas de materia prima

app.listen(port, () => {
    console.log(`El servidor está en el puerto ${port}`);
});
