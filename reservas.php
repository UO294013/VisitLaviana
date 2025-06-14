<!DOCTYPE HTML>
<?php
    session_start();
    class Reservas {
        protected $server;
        protected $user;
        protected $pass;
        protected $dbname;
        protected $conn;

        public function __construct(){
            $this->server = "localhost";
            $this->user = "DBUSER2025";
            $this->pass = "DBPWD2025";
            $this->dbname = "reservas";
            // Inicialización de la conexión
            $this->conn = new mysqli(
                $this->server,
                $this->user,
                $this->pass,
                $this->dbname
            );
            $this->conn->set_charset('utf8mb4');
            if ($this->conn->connect_error) {
                die('Error de conexión: ' . $this->conn->connect_error);
            }   
        }

        // Función para crear la base de datos y las tablas leyendo linea por linea del archivo reservas.sql
        public function crearBD() {
            $tempConn = new mysqli($this->server, $this->user, $this->pass);
            $path = __DIR__ . DIRECTORY_SEPARATOR .'php' . DIRECTORY_SEPARATOR . 'reservas.sql';
            if (!is_file($path) || !is_readable($path)) { // El archivo no existe o no es accesible
                echo "<p>No se encontró reservas.sql en $path</p>";
                return;
            }
            if (($file = fopen($path, 'r')) !== false) {
                $sql = "";
                while (($line = fgets($file)) !== false) {
                    $line = trim($line);
                    if (empty($line) || strpos($line, "--") === 0 || strpos($line, "/*") === 0) {
                        continue;
                    }
                    $sql .= $line;
                    if (substr($line, -1) === ";") {
                        $tempConn->query($sql);
                        $sql = "";
                    }
                }
                fclose($file);
            } else {  // El archivo no se pudo abrir
                echo "<p>Error al abrir el archivo que inicializa la base de datos</p>";
            }
            $tempConn->close();
        }
    
        // Función para importar datos de un archivo CSV a la base de datos
        public function importarCsv() {
            $path = __DIR__ . DIRECTORY_SEPARATOR . 'php' . DIRECTORY_SEPARATOR .   'reservas.csv';
            if (!is_file($path) || !is_readable($path)) { // El archivo no existe o no es accesible
                echo "<p>No se encontró reservas.csv en $path</p>";
                return;
            }
            $showErrors = false;
            if (($handle = fopen($path, "r")) !== false) {
                while (($data = fgetcsv($handle, 1000, ",")) !== false) {
                    try {
                        switch ($data[0]) {
                            case "estado_reserva": // estado
                                $stmt = $this->conn->prepare("INSERT INTO estado_reserva (estado) VALUES (?)");
                                $stmt->bind_param("s", $data[1]);
                                break;
                            case "tipo_recurso": // nombre
                                $stmt = $this->conn->prepare("INSERT INTO tipo_recurso (nombre) VALUES (?)");
                                $stmt->bind_param("s", $data[1]);
                                break;
                            case "recurso": // tipo_recurso_id, nombre, limite_ocupacion, precio, descripcion
                                $stmt = $this->conn->prepare("INSERT INTO recurso (tipo_recurso_id, nombre, limite_ocupacion, precio, descripcion) VALUES (?, ?, ?, ?, ?)");
                                $stmt->bind_param("isids", $data[1], $data[2], $data[3], $data[4], $data[5]);
                                break;
                            case "usuario": // nombre, apellidos, password, email, fecha_alta
                                $hashedPassword = password_hash($data[3], PASSWORD_DEFAULT);
                                $stmt = $this->conn->prepare("INSERT INTO usuario (nombre, apellidos, password, email, fecha_alta) VALUES (?, ?, ?, ?, ?)");
                                $stmt->bind_param("sssss", $data[1], $data[2], $hashedPassword, $data[4], $data[5]);
                                break;
                            case "reserva": // usuario_id, recurso_id, estado_id, presupuesto, fecha_hora_inicio, fecha_hora_fin
                                $stmt = $this->conn->prepare("INSERT INTO reserva (usuario_id, recurso_id, estado_id, presupuesto, fecha_hora_inicio, fecha_hora_fin) VALUES (?, ?, ?, ?, ?, ?)");
                                $stmt->bind_param("iiidss", $data[1], $data[2], $data[3], $data[4], $data[5], $data[6]);
                                break;
                        }
                        $stmt->execute();
                        $stmt->close();
                    } catch (Exception $e) {
                        $showErrors = true;
                    }
                }
                fclose($handle);
                if ($showErrors) { // La estructura del CSV no es correcta o hay errores al insertar en la base de datos
                    echo "<p>Algunos datos no se han podido importar correctamente debido a inconsistencias con la base de datos</p>";
                }
            } else { // No see pudo abrir el archivo CSV
                echo "<p>Error al importar los datos a la base de datos</p>";
            }
        }

        // Función para añadir información a la web encodeada correctamente
        public function imprimirOut($s) { 
            return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); 
        }

        // Función que registra un nuevo usuario en la base de datos. Devuelve true en caso de éxito, false en caso de error
        public function registrarUsuario(string $nombre, string $apellidos, string $email, string $password): bool {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return false;
            }

            $stmt = $this->conn->prepare("SELECT id FROM usuario WHERE email = ? OR (nombre = ? AND apellidos = ?)");
            $stmt->bind_param('sss', $email, $nombre, $apellidos);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows > 0) { // Email o usuario duplicado, no se puede registrar
                $stmt->close();
                return false;
            }
            $stmt->close();

            // Encriptar contraseña
            $hash = password_hash($password, PASSWORD_DEFAULT);

            // Insertar usuario
            $stmt = $this->conn->prepare(
                "INSERT INTO usuario (nombre, apellidos, password, email) VALUES (?, ?, ?, ?)"
            );
            $stmt->bind_param('ssss', $nombre, $apellidos, $hash, $email);
            $success = $stmt->execute();
            $stmt->close();

            return (bool)$success;
        }

        // Función que permite iniciar sesión de un usuario. Devuelve true si el usuario existe y la contraseña es correcta, false en caso contrario
        public function loginUsuario(string $email, string $password) {
            $stmt = $this->conn->prepare(
                "SELECT id, nombre, apellidos, password FROM usuario WHERE email = ?"
            );
            $stmt->bind_param('s', $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows !== 1) { // No existe un usuario con ese email
                $stmt->close();
                return false;
            }

            $user = $result->fetch_assoc();
            $stmt->close();

            if (!password_verify($password, $user['password'])) {
                return false;
            }

            unset($user['password']); // Importante no devolver el hash para mantener la seguridad de la contraseña
            return $user;
        }

        // Función que devuelve todos los recursos turísticos disponibles en la base de datos para reservar
        public function getRecursos(): array {
            $sql = "
                SELECT
                    r.id,
                    r.nombre,
                    tr.nombre AS tipo,
                    r.limite_ocupacion,
                    r.precio,
                    r.descripcion
                FROM recurso r
                JOIN tipo_recurso tr 
                    ON r.tipo_recurso_id = tr.id
                ORDER BY r.nombre ASC
            ";
            $result = $this->conn->query($sql);
            $recursos = [];
            if ($result) {
                while ($row = $result->fetch_assoc()) {
                    $recursos[] = $row;
                }
                $result->free();
            }
            return $recursos;
        }

        // Función que busca y devuelve un recurso por su ID en la base de datos. Devuelve un array asociativo con todos los campos o null si no existe
        public function getRecurso(int $id): ?array {
            $stmt = $this->conn->prepare("
                SELECT
                    r.id,
                    r.nombre,
                    tr.nombre AS tipo,
                    r.limite_ocupacion,
                    r.precio,
                    r.descripcion
                FROM recurso r
                JOIN tipo_recurso tr
                    ON r.tipo_recurso_id = tr.id
                WHERE r.id = ?
            ");
            $stmt->bind_param('i', $id);
            $stmt->execute();
            $result = $stmt->get_result();
            if ($result->num_rows !== 1) {
                $stmt->close();
                return null;
            }
            $recurso = $result->fetch_assoc();
            $stmt->close();
            return $recurso;
        }

        // Función utilizada para realizar una reserva para el usuario en sesión en uno de los recursos disponibles. Verifica límite de plazas y crea la reserva con estado "Activa". Devuelve true en caso de éxito, false en caso de error
        public function hacerReserva(int $usuarioId, int $recursoId, string $fecha_hora_inicio, string $fecha_hora_fin): bool {
            $this->conn->begin_transaction();
            try {
                $stmt = $this->conn->prepare(
                    "SELECT limite_ocupacion FROM recurso WHERE id = ? FOR UPDATE"
                );
                $stmt->bind_param('i', $recursoId);
                $stmt->execute();
                $res = $stmt->get_result();
                if ($res->num_rows !== 1) {
                    throw new Exception('Recurso no encontrado');
                }
                $limite = (int)$res->fetch_assoc()['limite_ocupacion'];
                $stmt->close();

                $stmt = $this->conn->prepare(
                    "SELECT COUNT(*) AS total FROM reserva WHERE recurso_id = ? AND estado_id = 1"
                );
                $stmt->bind_param('i', $recursoId);
                $stmt->execute();
                $count = (int)$stmt->get_result()->fetch_assoc()['total'];
                $stmt->close();

                if ($count >= $limite) { // Plazas agotadas
                    $this->conn->rollback();
                    return false;
                }

                $stmt = $this->conn->prepare(
                    "SELECT precio FROM recurso WHERE id = ?"
                );
                $stmt->bind_param('i', $recursoId);
                $stmt->execute();
                $precio = (float)$stmt->get_result()->fetch_assoc()['precio'];
                $stmt->close();

                $stmt = $this->conn->prepare(
                    "INSERT INTO reserva (usuario_id, recurso_id, estado_id, presupuesto, fecha_hora_inicio, fecha_hora_fin) VALUES (?, ?, 1, ?, ?, ?)"
                );
                $stmt->bind_param('iidss', $usuarioId, $recursoId, $precio, $fecha_hora_inicio, $fecha_hora_fin);
                $ok = $stmt->execute();
                $stmt->close();

                $this->conn->commit();
                return $ok;
            } catch (Exception $e) {
                $this->conn->rollback();
                return false;
            }
        }

        // Función que devuelve todas las reservas activas del usuario en sesión
        public function getReservasUsuario(int $usuarioId): ?array {
            $stmt = $this->conn->prepare("
                SELECT
                    res.id,
                    r.nombre AS recurso_nombre,
                    er.estado AS estado,
                    res.presupuesto,
                    res.fecha_hora_inicio,
                    res.fecha_hora_fin
                FROM reserva res
                JOIN recurso r 
                    ON res.recurso_id = r.id
                JOIN estado_reserva er
                    ON res.estado_id = er.id
                WHERE res.usuario_id = ?
                ORDER BY res.fecha_hora_inicio DESC
            ");
            $stmt->bind_param('i', $usuarioId);
            $stmt->execute();
            $result = $stmt->get_result();
            $reservas = [];
            while ($row = $result->fetch_assoc()) {
                $reservas[] = $row;
            }
            $stmt->close();
            return $reservas;
        }

        // Función que permite cancelar una reserva activa del usuario en sesión. Devuelve true si se ha cancelado correctamente, false en caso contrario
        public function cancelarReserva(int $usuarioId, int $reservaId): bool {
            $stmt = $this->conn->prepare("
                UPDATE reserva
                SET estado_id = (
                    SELECT id FROM estado_reserva WHERE estado = 'Cancelada'
                )
                WHERE id = ? AND usuario_id = ?"
            );
            $stmt->bind_param('ii', $reservaId, $usuarioId);
            $ok = $stmt->execute();
            $stmt->close();
            return (bool)$ok;
        }
    }

    $reservas = new Reservas();
    $action = $_REQUEST['action'] ?? 'home';
    // Inicialización de la base de datos (con datos de los ficheros reservas.sql y reservas.csv)
    if ($action === 'init') {
        $reservas->crearBD();
        $reservas->importarCsv();
        header('Location: reservas.php?action=home');
        exit;
    }
    if ($action === 'logout') {
        session_unset();
        session_destroy();
        header('Location: reservas.php?action=home');
        exit;
    }
?>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <title>VisitLaviana</title>
    <link rel="icon" href="multimedia/imagenes/favicon.ico" sizes="48x48">
    <meta name="author" content="Vicente Megido Garcia (UO294013)" />
    <meta name="description" content="Contenidos que permiten simular la realización de reservas en ciertos recursos turísticos en el concejo de Laviana, como museos, restaurantes, hoteles, instalaciones deportivas, etc." />
    <meta name="keywords" content="Laviana, turismo, reservas, viajes" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" type="text/css" href="estilo/estilo.css" />
    <link rel="stylesheet" type="text/css" href="estilo/layout.css" />
</head>
<body>
    <header>
        <h1><a href="index.html" title="Ir a la página principal">VisitLaviana</a></h1>
        <nav>
            <a href="index.html" title="Ir a la página principal">Página principal</a>
            <a href="gastronomia.html" title="Ir a la página de gastronomía">Gastronomía</a>
            <a href="rutas.html" title="Ir a la página de rutas">Rutas</a>
            <a href="meteorologia.html" title="Ir a la página de meteorología">Meteorología</a>
            <a href="juego.html" title="Ir a la página de juego">Juego</a>
            <a class="active" href="reservas.php" title="Ir a la página de reservas">Reservas</a>
            <a href="ayuda.html" title="Ir a la página de ayuda">Ayuda</a>
        </nav>
    </header>
    <p>Estás en: <a href="index.html" title="Ir a la página principal">Página principal</a> >> Reservas</p>
    <main>
        <h2>Reservas</h2>
        <menu>
            <li><a href="?action=home">Inicio</a></li>
            <?php if(!isset($_SESSION['user_id'])): ?>
                <li><a href="?action=register">Registrarse</a></li>
                <li><a href="?action=login">Iniciar sesión</a></li>
            <?php else: ?>
                <li><a href="?action=list">Recursos</a></li>
                <li><a href="?action=myreservas">Mis Reservas</a></li>
                <li><a href="?action=logout">Salir</a></li>
            <?php endif; ?>
            <li><a href="?action=init">Reiniciar BD</a></li>
        </menu>
        <?php
            switch($action) {
                case 'register':
                    if($_SERVER['REQUEST_METHOD']==='POST') {
                        $ok = $reservas->registrarUsuario($_POST['nombre'], $_POST['apellidos'], $_POST['email'], $_POST['password']);
                        echo $ok ? '<p>Registro completado con éxito</p>' : '<p>Error de registro. Comprueba que no tengas ya una cuenta creada e inténtalo de nuevo más tarde</p>';
                    }
        ?>  
        <h3>Registro de usuario</h3>
        <form method="post">
            <label>Nombre: <input name="nombre"></label>
            <label>Apellidos: <input name="apellidos"></label>
            <label>Email: <input type="email" name="email"></label>
            <label>Password: <input type="password" name="password"></label>
            <button type="submit">Registrar</button>
        </form>
        <?php
                    break;

                case 'login':
                    if($_SERVER['REQUEST_METHOD']==='POST') {
                        $user = $reservas->loginUsuario($_POST['email'], $_POST['password']);
                        if($user) {
                            $_SESSION['user_id'] = $user['id'];
                            header('Location: ?action=list'); 
                            exit;
                        } else {
                            echo '<p>Inicio de sesión fallido. Vuelva a introducir sus datos correctamente e inténtelo de nuevo</p>';
                        }
                    }
        ?>
        <h3>Inicio de sesión</h3>
        <form method="post">
            <label>Email: <input type="email" name="email"></label>
            <label>Password: <input type="password" name="password"></label>
            <button type="submit">Iniciar sesión</button>
        </form>
        <?php
                    break;
                case 'list':
                    $recursos = $reservas->getRecursos();
                    echo '<h3>Recursos disponibles</h3><ul>';
                    foreach($recursos as $r) {
                        echo '<li>'.$reservas->imprimirOut($r['nombre']).': '.$reservas->imprimirOut($r['descripcion']).' - Precio: '.$reservas->imprimirOut($r['precio']).' € - <a href="?action=reserve&id='.$r['id'].'">Reservar</a></li>';
                    }
                    echo '</ul>';
                    break;

                case 'reserve':
                    if(!isset($_SESSION['user_id'])) {
                        header('Location: ?action=login');
                        exit;
                    }
                    $rid = intval($_GET['id']);
                    if($_SERVER['REQUEST_METHOD']==='POST') {
                        $inicio = $_POST['fecha_inicio'] ?? '';
                        $fin    = $_POST['fecha_fin']    ?? '';
                        $ok = $reservas->hacerReserva($_SESSION['user_id'], $rid, $inicio, $fin);
                        echo $ok ? '<p>Reserva confirmada</p>' : '<p>No se pudo completar la reserva.</p>';
                    } else {
                        $r = $reservas->getRecurso($rid);
                        echo '<h3>Reservar '.$reservas->imprimirOut($r['nombre']).'</h3>';
                        echo '<form method="post">';
                        echo '<label>Inicio: <input type="date" name="fecha_inicio" required></label>';
                        echo '<label>Fin: <input type="date" name="fecha_fin" required></label>';
                        echo '<button>Confirmar Reserva</button>';
                        echo '</form>';
                    }
                    break;

                case 'myreservas':
                    if(!isset($_SESSION['user_id'])) {
                        header('Location: ?action=login');
                        exit;
                    }
                    $mis = $reservas->getReservasUsuario($_SESSION['user_id']);
                    echo '<h3>Mis Reservas</h3><ul>';
                    foreach($mis as $res) {
                        if ($res['estado'] === 'Cancelada' || $res['estado'] === 'Finalizada') {
                            echo '<li>'.$reservas->imprimirOut($res['recurso_nombre']).' - Estado: '.$reservas->imprimirOut($res['estado']).' - Presupuesto: '.$res['presupuesto'].' €</li>';
                        } else {
                            echo '<li>'.$reservas->imprimirOut($res['recurso_nombre']).' - Estado: '.$reservas->imprimirOut($res['estado']).' - Fechas: ['.$reservas->imprimirOut($res['fecha_hora_inicio']).' - '.$reservas->imprimirOut($res['fecha_hora_fin']).'] - Presupuesto: '.$res['presupuesto'].' € - <a href="?action=cancel&id='.$res['id'].'">Anular</a></li>';
                        }
                    }
                    echo '</ul>';
                    break;
  
                case 'cancel':
                    if(isset($_SESSION['user_id'])) {
                        $reservas->cancelarReserva($_SESSION['user_id'], intval($_GET['id']));
                        header('Location: ?action=myreservas');
                        exit;
                    }
                    break;

                default:
                    echo '<h3>Bienvenido a VisitLaviana Reservas</h3>';
                    if(!isset($_SESSION['user_id'])) {
                        echo '<p>Aquí podrás reservar los recursos turísticos que ofrecemos. Por favor, regístrate o inicia sesión para empezar a usar nuestros servicios</p>';
                    } else {
                        echo '<p>Pincha <a href="?action=list">aquí</a> para los recursos que puedes reservar</p>';
                    }
            }
        ?>
    </main>
</body>
</html>
