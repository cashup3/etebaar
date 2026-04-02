# Compliance, custody, and real funds

This repository is a **development scaffold**. It is **not** audited, **not** licensed, and **not** safe to operate with customer money without a full security and legal program.

If you handle **real user funds** in a **custodial** model (users deposit to wallets you control), you typically need **all** of the following, depending on jurisdiction:

- **Money transmitter / VASP licensing** and registration where required
- **KYC/AML** programs, sanctions screening, and suspicious activity reporting
- **Custody architecture**: cold/hot wallet policy, multisig, HSM or MPC, key ceremony, disaster recovery
- **Segregation of customer assets**, clear terms of service, and bankruptcy-remote structures where applicable
- **Penetration testing**, secure SDLC, incident response, and ongoing monitoring
- **Insurance** or equivalent risk transfer (often expected by partners and users)
- **Market integrity** controls: surveillance, manipulation checks, and outage/failover playbooks

**Do not** connect this scaffold directly to mainnet custody or production banking rails without qualified legal counsel and security engineers.

The Python reference worker may call **public market data** endpoints for development only. Your **settlement and custody** logic must not rely on unauthenticated third-party HTTP responses without explicit product design and risk acceptance.
