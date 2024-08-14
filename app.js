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

        const existingUser = await ModelUser.findOne({ email });
        if (existingUser) {
            return res.status(400).send("El correo ya está registrado");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await ModelUser.create({
            name,
            email,
            password: hashedPassword
        });

        res.status(201).send(newUser);
    } catch (error) {
        console.error("Error al registrar el usuario:", error);
        res.status(500).send("Error al registrar el usuario");
    }
});

userRouter.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await ModelUser.findOne({ email });
        if (!user) {
            return res.status(401).send("Usuario no encontrado");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send("Contraseña incorrecta");
        }

        const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });
        res.send({ token });
    } catch (error) {
        console.error("Error en el inicio de sesión:", error);
        res.status(500).send("Error en el inicio de sesión");
    }
});

// Routers para productos
const productRouter = express.Router();
productRouter.post("/", async (req, res) => {
    try {
        const body = req.body;
        const respuesta = await ModelProducts.create(body);
        res.status(201).send(respuesta);
    } catch (error) {
        console.error("Error al crear el producto:", error);
        res.status(500).send("Error al crear el producto");
    }
});

productRouter.get("/", async (req, res) => {
    try {
        const respuesta = await ModelProducts.find({});
        res.send(respuesta);
    } catch (error) {
        console.error("Error al obtener los productos:", error);
        res.status(500).send("Error al obtener los productos");
    }
});

productRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const respuesta = await ModelProducts.findById(id);
        if (!respuesta) {
            return res.status(404).send("Producto no encontrado");
        }
        res.send(respuesta);
    } catch (error) {
        console.error("Error al obtener el producto:", error);
        res.status(500).send("Error al obtener el producto");
    }
});

productRouter.put("/:id", async (req, res) => {
    try {
        const body = req.body;
        const id = req.params.id;
        const respuesta = await ModelProducts.findByIdAndUpdate(id, body, { new: true });
        if (!respuesta) {
            return res.status(404).send("Producto no encontrado");
        }
        res.send(respuesta);
    } catch (error) {
        console.error("Error al actualizar el producto:", error);
        res.status(500).send("Error al actualizar el producto");
    }
});

productRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const respuesta = await ModelProducts.deleteOne({ _id: id });
        if (respuesta.deletedCount === 0) {
            return res.status(404).send("Producto no encontrado");
        }
        res.send({ message: "Producto eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el producto:", error);
        res.status(500).send("Error al eliminar el producto");
    }
});

// Routers para órdenes
const orderRouter = express.Router();

orderRouter.post("/", async (req, res) => {
    try {
        const { productos, ...orderData } = req.body;

        const newOrder = await ModelOrder.create(orderData);

        for (let producto of productos) {
            const { productId, cantidad } = producto;
            const existingProduct = await ModelProducts.findById(productId).populate('materiaPrima.materialId');

            if (existingProduct) {
                if (existingProduct.stock < cantidad) {
                    return res.status(400).send(`No hay suficiente stock para el producto ${productId}`);
                }

                existingProduct.stock -= cantidad;
                await existingProduct.save();

                for (let material of existingProduct.materiaPrima) {
                    const existingMaterial = await ModelRawMaterial.findById(material.materialId);
                    if (existingMaterial) {
                        const cantidadNecesaria = material.cantidad * cantidad;

                        if (existingMaterial.cantidadDisponible < cantidadNecesaria) {
                            return res.status(400).send(`No hay suficiente materia prima para ${material.materialId}`);
                        }

                        existingMaterial.cantidadDisponible -= cantidadNecesaria;
                        await existingMaterial.save();
                    } else {
                        return res.status(404).send(`Materia prima ${material.materialId} no encontrada`);
                    }
                }
            } else {
                return res.status(404).send(`Producto ${productId} no encontrado`);
            }
        }

        res.status(201).send(newOrder);
    } catch (error) {
        console.error("Error al procesar el pedido:", error);
        res.status(500).send("Error al procesar el pedido");
    }
});

orderRouter.get("/", async (req, res) => {
    try {
        const orders = await ModelOrder.find({});
        res.status(200).send(orders);
    } catch (error) {
        console.error("Error al obtener las órdenes:", error);
        res.status(500).send("Error al obtener las órdenes");
    }
});

orderRouter.get("/:id", async (req, res) => {
    try {
        const order = await ModelOrder.findById(req.params.id);
        if (!order) {
            return res.status(404).send("Orden no encontrada");
        }
        res.status(200).send(order);
    } catch (error) {
        console.error("Error al obtener la orden:", error);
        res.status(500).send("Error al obtener la orden");
    }
});

// Routers para clientes
const customerRouter = express.Router();
customerRouter.post("/", async (req, res) => {
    try {
        const body = req.body;
        const respuesta = await ModelCustomer.create(body);
        res.status(201).send(respuesta);
    } catch (error) {
        console.error("Error al crear el cliente:", error);
        res.status(500).send("Error al crear el cliente");
    }
});

customerRouter.get("/", async (req, res) => {
    try {
        const respuesta = await ModelCustomer.find({});
        res.send(respuesta);
    } catch (error) {
        console.error("Error al obtener los clientes:", error);
        res.status(500).send("Error al obtener los clientes");
    }
});

customerRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const respuesta = await ModelCustomer.findById(id);
        if (!respuesta) {
            return res.status(404).send("Cliente no encontrado");
        }
        res.send(respuesta);
    } catch (error) {
        console.error("Error al obtener el cliente:", error);
        res.status(500).send("Error al obtener el cliente");
    }
});

customerRouter.put("/:id", async (req, res) => {
    try {
        const body = req.body;
        const id = req.params.id;
        const respuesta = await ModelCustomer.findByIdAndUpdate(id, body, { new: true });
        if (!respuesta) {
            return res.status(404).send("Cliente no encontrado");
        }
        res.send(respuesta);
    } catch (error) {
        console.error("Error al actualizar el cliente:", error);
        res.status(500).send("Error al actualizar el cliente");
    }
});

customerRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const respuesta = await ModelCustomer.deleteOne({ _id: id });
        if (respuesta.deletedCount === 0) {
            return res.status(404).send("Cliente no encontrado");
        }
        res.send({ message: "Cliente eliminado correctamente" });
    } catch (error) {
        console.error("Error al eliminar el cliente:", error);
        res.status(500).send("Error al eliminar el cliente");
    }
});

// Routers para materia prima
const materialPrimaRouter = express.Router();

materialPrimaRouter.post("/", async (req, res) => {
    try {
        const body = req.body;
        const respuesta = await ModelRawMaterial.create(body);
        res.status(201).send(respuesta);
    } catch (error) {
        console.error('Error al crear la materia prima:', error);
        res.status(500).send({ error: 'Error al crear la materia prima.' });
    }
});

materialPrimaRouter.get("/", async (req, res) => {
    try {
        const respuesta = await ModelRawMaterial.find({});
        res.send(respuesta);
    } catch (error) {
        console.error('Error al obtener las materias primas:', error);
        res.status(500).send({ error: 'Error al obtener las materias primas.' });
    }
});

materialPrimaRouter.get("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const respuesta = await ModelRawMaterial.findById(id);
        if (!respuesta) {
            return res.status(404).send({ error: 'Materia prima no encontrada.' });
        }
        res.send(respuesta);
    } catch (error) {
        console.error('Error al obtener la materia prima:', error);
        res.status(500).send({ error: 'Error al obtener la materia prima.' });
    }
});

materialPrimaRouter.put("/:id", async (req, res) => {
    const { cantidadRecibida } = req.body;
    const id = req.params.id;

    if (!cantidadRecibida || cantidadRecibida <= 0) {
        return res.status(400).send({ error: 'La cantidad recibida debe ser un número positivo.' });
    }

    try {
        const respuesta = await ModelRawMaterial.findByIdAndUpdate(
            id,
            {
                $inc: { cantidadDisponible: cantidadRecibida },
                $set: { fechaRecepcion: new Date() }
            },
            { new: true }
        );

        if (!respuesta) {
            return res.status(404).send({ error: 'Materia prima no encontrada.' });
        }

        res.send(respuesta);
    } catch (error) {
        console.error('Error al actualizar la materia prima:', error);
        res.status(500).send({ error: 'Error al actualizar la materia prima.' });
    }
});

materialPrimaRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const respuesta = await ModelRawMaterial.deleteOne({ _id: id });
        if (respuesta.deletedCount === 0) {
            return res.status(404).send({ error: 'Materia prima no encontrada.' });
        }
        res.send({ message: 'Materia prima eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar la materia prima:', error);
        res.status(500).send({ error: 'Error al eliminar la materia prima.' });
    }
});

app.use(express.json());
app.use('/users', userRouter);
app.use('/products', productRouter);
app.use('/orders', orderRouter);
app.use('/customers', customerRouter);
app.use('/materialPrima', materialPrimaRouter);

app.listen(port, () => {
    console.log(`El servidor está en el puerto ${port}`);
});

// Conectar a la base de datos
dbconnect();
