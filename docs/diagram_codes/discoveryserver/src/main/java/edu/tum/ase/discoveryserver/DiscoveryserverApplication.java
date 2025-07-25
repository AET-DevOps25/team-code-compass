package edu.tum.ase.discoveryserver;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
public class DiscoveryserverApplication {

	public static void main(String[] args) {
		SpringApplication.run(DiscoveryserverApplication.class, args);
	}

}
