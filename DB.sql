CREATE TABLE categories(
catid INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
name VARCHAR(512) NOT NULL
) ENGINE=INNODB;

INSERT INTO categories (name) VALUES ('Movies & TV');
INSERT INTO categories (name) VALUES ('Computer');
INSERT INTO categories (name) VALUES ('Food');

CREATE TABLE products(
pid INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
catid INTEGER UNSIGNED,
name VARCHAR(512) NOT NULL,
price decimal(9,2),
description TEXT,
FOREIGN KEY (catid) REFERENCES categories(catid)
) ENGINE=INNODB;

CREATE INDEX i1 ON products(catid);

CREATE TABLE users (
uid int(11) NOT NULL AUTO_INCREMENT,
username varchar(512) NOT NULL,
salt varchar(512) NOT NULL,
saltedPassword varchar(512) NOT NULL,
admin int(1) DEFAULT NULL,
PRIMARY KEY (uid)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;

CREATE TABLE payments (
payid INTEGER UNSIGNED PRIMARY KEY AUTO_INCREMENT,
userid int(11) NOT NULL,
paymentid varchar(512) NOT NULL,
state varchar(512) NOT NULL,
dateCreated varchar(512) NOT NULL,
FOREIGN KEY (userid) REFERENCES users(uid)
) ENGINE=INNODB;

CREATE INDEX i2 ON payments(userid, paymentid);
CREATE INDEX i3 ON payments(state);

INSERT INTO `users` VALUES 
(1,'yeuk20025@hotmail.com','8U7stCTWLQA4uZWeDQYX8bxH','vUoaiAGqUBEHJxCFbkVkTr/o8DrY4onmtjnhwUNj91I=',1),(2,'test@test.com','CFFbdvxsDnDpcHbYQCLbbFhU','d5v4BnqK+9da7A0jp3nunJreRCg73p99+j/ytdbthvs=',0);